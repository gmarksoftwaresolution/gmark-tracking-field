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

            if (!employee.LastLocationTimestamp.HasValue)
            {
                employee.LastMovementTimestamp = currentTimestamp;
            }
            
            if (employee.LastLocationTimestamp.HasValue)
            {
                var istZone = GetIstTimeZone();
                var currentIstDate = TimeZoneInfo.ConvertTimeFromUtc(currentTimestamp, istZone).Date;
                var lastIstDate = TimeZoneInfo.ConvertTimeFromUtc(employee.LastLocationTimestamp.Value, istZone).Date;

                if (currentIstDate > lastIstDate)
                {
                    employee.TodayTravelledDistance = 0;
                    employee.LastMovementTimestamp = currentTimestamp;
                }
            }

            // Strict rule: Travelled distance ONLY accumulates when employee is actively on a trip!
            bool isTripStarted = string.Equals(employee.TripStatus, "Started", StringComparison.OrdinalIgnoreCase) && employee.TripStartTime.HasValue;
            bool isMovementPoint = false;

            if (isTripStarted && request.Latitude.HasValue && request.Longitude.HasValue && request.Latitude.Value != 0 && request.Longitude.Value != 0)
            {
                // Only compare against locations recorded AFTER the current trip started!
                var prevLocation = await _context.LocationHistories
                    .Where(lh => lh.EmployeeId == request.EmployeeId && lh.Timestamp >= employee.TripStartTime.GetValueOrDefault())
                    .OrderByDescending(lh => lh.Timestamp)
                    .FirstOrDefaultAsync();

                if (prevLocation != null)
                {
                    double distanceMetres = CalculateDistance(prevLocation.Latitude, prevLocation.Longitude, request.Latitude.Value, request.Longitude.Value);
                    double timeDiffSeconds = (currentTimestamp - prevLocation.Timestamp).TotalSeconds;

                    // Movement filter: at least 8m to avoid GPS jitter, under 5000m to avoid teleports, and max speed 150 km/h (41.67 m/s)
                    if (distanceMetres >= 8 && distanceMetres <= 5000 && timeDiffSeconds > 0)
                    {
                        double speed = distanceMetres / timeDiffSeconds;
                        if (speed <= 41.67) // max 150 km/h in m/s
                        {
                            employee.TodayTravelledDistance += distanceMetres;
                            isMovementPoint = true;
                        }
                        employee.LastMovementTimestamp = currentTimestamp;
                    }
                }
                else
                {
                    // First location ping of this active trip: establish baseline coordinate
                    employee.LastMovementTimestamp = currentTimestamp;
                    isMovementPoint = true;
                }
            }


            if (request.Latitude.HasValue && request.Longitude.HasValue && request.Latitude.Value != 0 && request.Longitude.Value != 0)
            {
                employee.LastLatitude = request.Latitude.Value;
                employee.LastLongitude = request.Longitude.Value;
            }

            if (!string.IsNullOrWhiteSpace(request.Address))
            {
                employee.LastKnownAddress = request.Address.Trim();
            }
            else if (!string.IsNullOrWhiteSpace(request.LocationName))
            {
                employee.LastKnownAddress = request.LocationName.Trim();
            }

            if (request.BatteryLevel.HasValue && request.BatteryLevel.Value > 0 && request.BatteryLevel.Value <= 100)
            {
                employee.BatteryLevel = request.BatteryLevel.Value;
            }

            employee.LastLocationTimestamp = currentTimestamp;

            // Reverse geocode if coordinates are present but address is missing
            if (string.IsNullOrWhiteSpace(employee.LastKnownAddress) && request.Latitude.HasValue && request.Longitude.HasValue && request.Latitude.Value != 0 && request.Longitude.Value != 0)
            {
                try
                {
                    using var nomClient = new System.Net.Http.HttpClient();
                    nomClient.DefaultRequestHeaders.Add("User-Agent", "NavbharatAgroAPI/1.0");
                    nomClient.Timeout = TimeSpan.FromSeconds(4);
                    var nLat = request.Latitude.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
                    var nLng = request.Longitude.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
                    var nomUrl = $"https://nominatim.openstreetmap.org/reverse?format=json&lat={nLat}&lon={nLng}&zoom=18&addressdetails=1";
                    var nomDoc = await nomClient.GetFromJsonAsync<JsonDocument>(nomUrl);
                    if (nomDoc != null && nomDoc.RootElement.TryGetProperty("address", out var addrEl))
                    {
                        string village = "";
                        string county = "";
                        string state = "";
                        if (addrEl.TryGetProperty("village", out var vEl)) village = vEl.GetString() ?? "";
                        else if (addrEl.TryGetProperty("suburb", out var sEl)) village = sEl.GetString() ?? "";
                        else if (addrEl.TryGetProperty("town", out var tEl)) village = tEl.GetString() ?? "";
                        else if (addrEl.TryGetProperty("city", out var cEl)) village = cEl.GetString() ?? "";
                        
                        if (addrEl.TryGetProperty("county", out var coEl)) county = coEl.GetString() ?? "";
                        else if (addrEl.TryGetProperty("state_district", out var sdEl)) county = sdEl.GetString() ?? "";
                        
                        if (addrEl.TryGetProperty("state", out var stEl)) state = stEl.GetString() ?? "";

                        var parts = new List<string> { village, county, state }.Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList();
                        if (parts.Count > 0)
                        {
                            employee.LastKnownAddress = string.Join(", ", parts);
                        }
                    }
                }
                catch { }
            }

            bool shouldGeocode = false;
            if (request.Latitude.HasValue && request.Longitude.HasValue)
            {
                if (string.IsNullOrEmpty(employee.LastKnownAddress))
                {
                    shouldGeocode = true;
                }
                else
                {
                    if (_lastGeocodedLocations.TryGetValue(employee.Id, out var lastGeoLoc))
                    {
                        if (CalculateDistance(lastGeoLoc.Lat, lastGeoLoc.Lng, request.Latitude.Value, request.Longitude.Value) >= 50)
                        {
                            shouldGeocode = true;
                        }
                    }
                    else
                    {
                        shouldGeocode = true; // Establish baseline
                    }
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
                                    _lastGeocodedLocations[employee.Id] = (request.Latitude!.Value, request.Longitude!.Value);
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

            // Only save a coordinate breadcrumb if moving during trip, or at periodic 2-minute heartbeat
            if (request.Latitude.HasValue && request.Longitude.HasValue && request.Latitude.Value != 0 && request.Longitude.Value != 0)
            {
                bool shouldSaveBreadcrumb = isMovementPoint;
                if (!shouldSaveBreadcrumb)
                {
                    var lastPing = await _context.LocationHistories
                        .Where(lh => lh.EmployeeId == request.EmployeeId)
                        .OrderByDescending(lh => lh.Timestamp)
                        .Select(lh => lh.Timestamp)
                        .FirstOrDefaultAsync();

                    if (lastPing == default || (currentTimestamp - lastPing).TotalMinutes >= 2)
                    {
                        shouldSaveBreadcrumb = true;
                    }
                }

                if (shouldSaveBreadcrumb)
                {
                    var locationHistory = new LocationHistory
                    {
                        EmployeeId = request.EmployeeId,
                        Latitude = request.Latitude.Value,
                        Longitude = request.Longitude.Value,
                        Timestamp = currentTimestamp
                    };

                    _context.LocationHistories.Add(locationHistory);
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Location/Ping saved successfully for EmployeeId {request.EmployeeId}. Today Travelled: {employee.TodayTravelledDistance:F1}m");

            int stoppedDurationMinutes = employee.LastMovementTimestamp.HasValue ? (int)(currentTimestamp - employee.LastMovementTimestamp.Value).TotalMinutes : 0;

            await _hubContext.Clients.All.SendAsync("ReceiveLocationUpdate", new
            {
                EmployeeId = employee.Id,
                Latitude = employee.LastLatitude,
                Longitude = employee.LastLongitude,
                Timestamp = currentTimestamp,
                TravelledDistance = employee.TodayTravelledDistance,
                LastKnownAddress = employee.LastKnownAddress,
                StoppedDurationMinutes = stoppedDurationMinutes,
                LastMovementTimestamp = employee.LastMovementTimestamp
            });

            var response = new TrackingLocationResponseDto
            {
                Id = 0,
                EmployeeId = employee.Id,
                Latitude = request.Latitude ?? 0,
                Longitude = request.Longitude ?? 0,
                Timestamp = currentTimestamp,
                TodayTravelledDistance = employee.TodayTravelledDistance,
                Message = "Location saved successfully."
            };

            return Ok(response);
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
                    Latitude = fv.Latitude.GetValueOrDefault(),
                    Longitude = fv.Longitude.GetValueOrDefault(),
                    Timestamp = fv.VisitDate.ToDateTime(fv.VisitTime, DateTimeKind.Utc)
                });
            }

            foreach (var ob in orderBookings)
            {
                checkpoints.Add(new RouteCheckpointDto
                {
                    Type = "OrderBooking",
                    Name = ob.CustomerName,
                    Latitude = ob.Latitude.GetValueOrDefault(),
                    Longitude = ob.Longitude.GetValueOrDefault(),
                    Timestamp = ob.BookingDate.ToDateTime(ob.BookingTime, DateTimeKind.Utc)
                });
            }

            checkpoints = checkpoints.OrderBy(c => c.Timestamp).ToList();

            foreach (var cp in checkpoints)
            {
                var cpUtc = cp.Timestamp;
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
                    GpsPings = gpsPings,
                    Checkpoints = checkpoints
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

            var apiKey = Environment.GetEnvironmentVariable("GOOGLE_MAPS_ROUTES_API_KEY") ?? "AIzaSyC9-50lwsUipQ9txoB9OoRnJd8HeCNXzrI";
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

        private static (double Lat, double Lng, string Address) ResolveAreaCoordinates(string? assignedArea)
        {
            var area = assignedArea?.Trim().ToLowerInvariant() ?? "";
            if (area.Contains("gadhinglaj"))
                return (16.2227, 74.3519, "Gadhinglaj, Maharashtra");
            if (area.Contains("nesari"))
                return (16.0717, 74.3314, "Nesari, Maharashtra");
            if (area.Contains("ajara") || area.Contains("ajra"))
                return (16.1171, 74.2058, "Ajara, Maharashtra");
            if (area.Contains("chandgad"))
                return (15.9328, 74.3941, "Chandgad, Maharashtra");
            if (area.Contains("kolhapur"))
                return (16.7050, 74.2433, "Kolhapur, Maharashtra");
            if (area.Contains("nagpur"))
                return (21.1458, 79.0882, "Nagpur, Maharashtra");
            if (area.Contains("ichalkaranji"))
                return (16.6957, 74.4636, "Ichalkaranji, Maharashtra");

            return (16.2227, 74.3519, !string.IsNullOrWhiteSpace(assignedArea) ? assignedArea + ", Maharashtra" : "Maharashtra, India");
        }
    }
}