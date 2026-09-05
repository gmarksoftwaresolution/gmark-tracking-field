using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using NavbharatAgroAPI.Models;
using Microsoft.AspNetCore.SignalR;
using NavbharatAgroAPI.Hubs;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Net.Http.Json;
using System.Text.Json;

namespace NavbharatAgroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrackingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TrackingController> _logger;
        private readonly IHubContext<TrackingHub> _hubContext;
        
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<int, (double Lat, double Lng)> _lastGeocodedLocations = new();

        public TrackingController(AppDbContext context, ILogger<TrackingController> logger, IHubContext<TrackingHub> hubContext)
        {
            _context = context;
            _logger = logger;
            _hubContext = hubContext;
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371e3; // metres
            var p1 = lat1 * Math.PI / 180;
            var p2 = lat2 * Math.PI / 180;
            var dp = (lat2 - lat1) * Math.PI / 180;
            var dl = (lon2 - lon1) * Math.PI / 180;

            var a = Math.Sin(dp / 2) * Math.Sin(dp / 2) +
                    Math.Cos(p1) * Math.Cos(p2) *
                    Math.Sin(dl / 2) * Math.Sin(dl / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
        }

        private TimeZoneInfo GetIstTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            }
        }

        [HttpPost("location")]
        public async Task<IActionResult> SaveLocation([FromBody] TrackingLocationRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == request.EmployeeId);
            if (employee == null)
            {
                return NotFound(new { Message = "Employee not found." });
            }

            var currentTimestamp = request.Timestamp ?? DateTime.UtcNow;

            if (employee.LastLocationTimestamp.HasValue)
            {
                var istZone = GetIstTimeZone();
                var currentIstDate = TimeZoneInfo.ConvertTimeFromUtc(currentTimestamp, istZone).Date;
                var lastIstDate = TimeZoneInfo.ConvertTimeFromUtc(employee.LastLocationTimestamp.Value, istZone).Date;

                if (currentIstDate > lastIstDate)
                {
                    employee.TodayTravelledDistance = 0;
                }
            }

            var prevLocation = await _context.LocationHistories
                .Where(lh => lh.EmployeeId == request.EmployeeId)
                .OrderByDescending(lh => lh.Timestamp)
                .FirstOrDefaultAsync();

            if (prevLocation != null)
            {
                double distanceMetres = CalculateDistance(prevLocation.Latitude, prevLocation.Longitude, request.Latitude, request.Longitude);
                double timeDiffSeconds = (currentTimestamp - prevLocation.Timestamp).TotalSeconds;

                if (distanceMetres >= 15 && timeDiffSeconds > 0)
                {
                    double speed = distanceMetres / timeDiffSeconds;
                    if (speed <= 41.67) // 150 km/h in m/s
                    {
                        employee.TodayTravelledDistance += distanceMetres;
                    }
                }
            }

            employee.LastLatitude = request.Latitude;
            employee.LastLongitude = request.Longitude;
            employee.LastLocationTimestamp = currentTimestamp;

            bool shouldGeocode = false;
            if (string.IsNullOrEmpty(employee.LastKnownAddress))
            {
                shouldGeocode = true;
            }
            else
            {
                if (_lastGeocodedLocations.TryGetValue(employee.Id, out var lastGeoLoc))
                {
                    if (CalculateDistance(lastGeoLoc.Lat, lastGeoLoc.Lng, request.Latitude, request.Longitude) >= 50)
                    {
                        shouldGeocode = true;
                    }
                }
                else
                {
                    shouldGeocode = true; // Establish baseline
                }
            }

            if (shouldGeocode)
            {
                var apiKey = Environment.GetEnvironmentVariable("GOOGLE_MAPS_GEOCODING_API_KEY");
                if (!string.IsNullOrEmpty(apiKey))
                {
                    try
                    {
                        using var httpClient = new System.Net.Http.HttpClient();
                        var url = $"https://maps.googleapis.com/maps/api/geocode/json?latlng={request.Latitude},{request.Longitude}&key={apiKey}";
                        var geocodeResponse = await httpClient.GetFromJsonAsync<JsonDocument>(url);

                        if (geocodeResponse != null && geocodeResponse.RootElement.GetProperty("status").GetString() == "OK")
                        {
                            var results = geocodeResponse.RootElement.GetProperty("results");
                            if (results.GetArrayLength() > 0)
                            {
                                var addressComponents = results[0].GetProperty("address_components");
                                string locality = "";
                                string sublocality = "";
                                string district = "";
                                string state = "";

                                foreach (var component in addressComponents.EnumerateArray())
                                {
                                    var types = component.GetProperty("types").EnumerateArray().Select(t => t.GetString()).ToList();
                                    string longName = component.GetProperty("long_name").GetString() ?? "";

                                    if (types.Contains("locality")) locality = longName;
                                    if (types.Contains("sublocality") || types.Contains("sublocality_level_1")) sublocality = longName;
                                    if (types.Contains("administrative_area_level_3")) district = longName;
                                    if (types.Contains("administrative_area_level_1")) state = longName;
                                }

                                string place = !string.IsNullOrEmpty(sublocality) ? sublocality : locality;
                                string area = !string.IsNullOrEmpty(district) ? district : state;
                                
                                string newAddress = "";
                                if (!string.IsNullOrEmpty(place) && !string.IsNullOrEmpty(area))
                                    newAddress = $"{place} | {area}";
                                else if (!string.IsNullOrEmpty(place))
                                    newAddress = place;
                                else if (!string.IsNullOrEmpty(area))
                                    newAddress = area;
                                
                                if (!string.IsNullOrEmpty(newAddress))
                                {
                                    employee.LastKnownAddress = newAddress;
                                    _lastGeocodedLocations[employee.Id] = (request.Latitude, request.Longitude);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Geocoding failed.");
                    }
                }
            }

            var locationHistory = new LocationHistory
            {
                EmployeeId = request.EmployeeId,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Timestamp = currentTimestamp
            };

            _context.LocationHistories.Add(locationHistory);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Location saved successfully for EmployeeId {request.EmployeeId}.");

            await _hubContext.Clients.All.SendAsync("ReceiveLocationUpdate", new
            {
                EmployeeId = locationHistory.EmployeeId,
                Latitude = locationHistory.Latitude,
                Longitude = locationHistory.Longitude,
                Timestamp = locationHistory.Timestamp,
                TravelledDistance = employee.TodayTravelledDistance,
                LastKnownAddress = employee.LastKnownAddress
            });

            var response = new TrackingLocationResponseDto
            {
                Id = locationHistory.Id,
                EmployeeId = locationHistory.EmployeeId,
                Latitude = locationHistory.Latitude,
                Longitude = locationHistory.Longitude,
                Timestamp = locationHistory.Timestamp,
                Message = "Location saved successfully."
            };

            return CreatedAtAction(nameof(SaveLocation), new { id = locationHistory.Id }, response);
        }
        [HttpGet("route/{employeeId}")]
        public async Task<IActionResult> GetRoute(int employeeId, [FromQuery] string date)
        {
            if (!DateOnly.TryParse(date, out var targetDate))
            {
                return BadRequest(new { Message = "Invalid date format. Use YYYY-MM-DD." });
            }

            var istZone = GetIstTimeZone();
            
            var istStart = new DateTime(targetDate.Year, targetDate.Month, targetDate.Day, 0, 0, 0, DateTimeKind.Unspecified);
            var istEnd = istStart.AddDays(1).AddTicks(-1);

            var utcStart = TimeZoneInfo.ConvertTimeToUtc(istStart, istZone);
            var utcEnd = TimeZoneInfo.ConvertTimeToUtc(istEnd, istZone);

            var locationHistories = await _context.LocationHistories
                .Where(lh => lh.EmployeeId == employeeId && lh.Timestamp >= utcStart && lh.Timestamp <= utcEnd)
                .OrderBy(lh => lh.Timestamp)
                .ToListAsync();

            var fieldVisits = await _context.FieldVisits
                .Where(fv => fv.EmployeeId == employeeId && fv.VisitDate == targetDate && fv.Latitude.HasValue && fv.Longitude.HasValue)
                .ToListAsync();

            var orderBookings = await _context.OrderBookings
                .Where(ob => ob.EmployeeId == employeeId && ob.BookingDate == targetDate && ob.Latitude.HasValue && ob.Longitude.HasValue)
                .ToListAsync();

            var checkpoints = new System.Collections.Generic.List<RouteCheckpointDto>();

            foreach (var fv in fieldVisits)
            {
                checkpoints.Add(new RouteCheckpointDto
                {
                    Type = "FieldVisit",
                    Name = fv.CustomerName,
                    Latitude = fv.Latitude.Value,
                    Longitude = fv.Longitude.Value,
                    Timestamp = fv.VisitDate.ToDateTime(fv.VisitTime, DateTimeKind.Unspecified)
                });
            }

            foreach (var ob in orderBookings)
            {
                checkpoints.Add(new RouteCheckpointDto
                {
                    Type = "OrderBooking",
                    Name = ob.CustomerName,
                    Latitude = ob.Latitude.Value,
                    Longitude = ob.Longitude.Value,
                    Timestamp = ob.BookingDate.ToDateTime(ob.BookingTime, DateTimeKind.Unspecified)
                });
            }

            checkpoints = checkpoints.OrderBy(c => c.Timestamp).ToList();

            foreach (var cp in checkpoints)
            {
                var cpUtc = TimeZoneInfo.ConvertTimeToUtc(cp.Timestamp, istZone);
                // find nearest GPS ping before or at checkpoint time (up to 2 hours before)
                var latestPing = locationHistories
                    .Where(lh => lh.Timestamp <= cpUtc && lh.Timestamp >= cpUtc.AddHours(-2))
                    .OrderByDescending(lh => lh.Timestamp)
                    .FirstOrDefault();

                if (latestPing != null)
                {
                    cp.EmployeeGpsLatitude = latestPing.Latitude;
                    cp.EmployeeGpsLongitude = latestPing.Longitude;
                    cp.EmployeeGpsTimestamp = latestPing.Timestamp;
                    
                    double distMeters = CalculateDistance(latestPing.Latitude, latestPing.Longitude, cp.Latitude, cp.Longitude);
                    double distKm = distMeters / 1000.0;
                    cp.LocationDifferenceKm = distKm;
                    
                    if (distKm <= 0.5)
                    {
                        cp.LocationMatchStatus = "MATCHED";
                    }
                    else
                    {
                        cp.LocationMatchStatus = "LOCATION MISMATCH";
                    }
                }
                else
                {
                    cp.LocationMatchStatus = "GPS_UNAVAILABLE";
                }
            }

            var gpsPings = locationHistories.Select(lh => new RouteCoordinateDto
            {
                Latitude = lh.Latitude,
                Longitude = lh.Longitude,
                Timestamp = lh.Timestamp
            }).OrderBy(p => p.Timestamp).ToList();

            double totalDistanceKm = 0;
            for (int i = 1; i < gpsPings.Count; i++)
            {
                var prevLoc = gpsPings[i - 1];
                var currLoc = gpsPings[i];
                
                double distMeters = CalculateDistance(prevLoc.Latitude, prevLoc.Longitude, currLoc.Latitude, currLoc.Longitude);
                double timeDiffSeconds = (currLoc.Timestamp - prevLoc.Timestamp).TotalSeconds;

                if (distMeters >= 15 && timeDiffSeconds > 0)
                {
                    double speed = distMeters / timeDiffSeconds;
                    if (speed <= 41.67) // 150 km/h in m/s
                    {
                        totalDistanceKm += (distMeters / 1000.0);
                    }
                }
            }

            if (gpsPings.Count < 2)
            {
                return Ok(new RouteResponseDto 
                { 
                    EmployeeId = employeeId, 
                    Message = "Insufficient GPS data to generate a route.",
                    TotalDistanceKm = totalDistanceKm,
                    GpsPings = gpsPings
                });
            }

            var originLoc = gpsPings.First();
            var destLoc = gpsPings.Last();

            var response = new RouteResponseDto
            {
                EmployeeId = employeeId,
                Origin = new RouteCoordinateDto { Latitude = originLoc.Latitude, Longitude = originLoc.Longitude, Timestamp = originLoc.Timestamp },
                Destination = new RouteCoordinateDto { Latitude = destLoc.Latitude, Longitude = destLoc.Longitude, Timestamp = destLoc.Timestamp },
                Checkpoints = checkpoints,
                TotalDistanceKm = totalDistanceKm,
                GpsPings = gpsPings
            };

            var apiKey = Environment.GetEnvironmentVariable("GOOGLE_MAPS_ROUTES_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
            {
                return Ok(response);
            }

            var waypoints = checkpoints.Take(25).Select(c => new
            {
                location = new { latLng = new { latitude = c.Latitude, longitude = c.Longitude } }
            }).ToList();

            var routeRequest = new
            {
                origin = new { location = new { latLng = new { latitude = originLoc.Latitude, longitude = originLoc.Longitude } } },
                destination = new { location = new { latLng = new { latitude = destLoc.Latitude, longitude = destLoc.Longitude } } },
                intermediates = waypoints,
                travelMode = "DRIVE",
                routingPreference = "TRAFFIC_AWARE_OPTIMAL"
            };

            try
            {
                using var httpClient = new System.Net.Http.HttpClient();
                httpClient.DefaultRequestHeaders.Add("X-Goog-Api-Key", apiKey);
                httpClient.DefaultRequestHeaders.Add("X-Goog-FieldMask", "routes.polyline.encodedPolyline");

                var googleResponse = await httpClient.PostAsJsonAsync("https://routes.googleapis.com/directions/v2:computeRoutes", routeRequest);
                
                if (googleResponse.IsSuccessStatusCode)
                {
                    var result = await googleResponse.Content.ReadFromJsonAsync<JsonDocument>();
                    if (result != null && result.RootElement.TryGetProperty("routes", out var routes) && routes.GetArrayLength() > 0)
                    {
                        var route = routes[0];
                        if (route.TryGetProperty("polyline", out var polyline) && polyline.TryGetProperty("encodedPolyline", out var encoded))
                        {
                            response.EncodedPolyline = encoded.GetString() ?? "";
                        }
                    }
                }
                else
                {
                    _logger.LogWarning($"Google Routes API failed with status code {googleResponse.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to call Google Routes API.");
            }

            return Ok(response);
        }
    }
}
