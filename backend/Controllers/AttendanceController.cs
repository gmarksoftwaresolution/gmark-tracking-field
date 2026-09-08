using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using NavbharatAgroAPI.Models;
using NavbharatAgroAPI.Services;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    [Route("api/attendance")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AttendanceController> _logger;
        private readonly IGeocodingService _geocodingService;
        private readonly IWebHostEnvironment _environment;

        public AttendanceController(
            AppDbContext context,
            IConfiguration configuration,
            ILogger<AttendanceController> logger,
            IGeocodingService geocodingService,
            IWebHostEnvironment environment)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _geocodingService = geocodingService;
            _environment = environment;
        }

        private double GetOfficeLatitude() => _configuration.GetValue<double>("AttendanceSettings:OfficeLatitude", 18.5204);
        private double GetOfficeLongitude() => _configuration.GetValue<double>("AttendanceSettings:OfficeLongitude", 73.8567);
        private double GetAttendanceRadiusMeters() => _configuration.GetValue<double>("AttendanceSettings:AttendanceRadiusMeters", 100.0);
        private double GetMaxAccuracyMeters() => _configuration.GetValue<double>("AttendanceSettings:MaxLocationAccuracyMeters", 50.0);

        [HttpGet("config")]
        public ActionResult<AttendanceConfigDto> GetAttendanceConfig()
        {
            return Ok(new AttendanceConfigDto
            {
                OfficeLatitude = GetOfficeLatitude(),
                OfficeLongitude = GetOfficeLongitude(),
                AttendanceRadiusMeters = GetAttendanceRadiusMeters(),
                MaxLocationAccuracyMeters = GetMaxAccuracyMeters()
            });
        }

        [HttpGet("today-all")]
        public async Task<ActionResult<System.Collections.Generic.IEnumerable<AttendanceResponseDto>>> GetAllTodayAttendance()
        {
            var todayUtc = DateTime.UtcNow.Date;
            var records = await _context.AttendanceRecords
                .Where(a => a.AttendanceDate == todayUtc)
                .ToListAsync();

            var dtos = records.Select(r => MapToResponseDto(r, "Retrieved successfully")).ToList();
            return Ok(dtos);
        }

        [HttpGet("today/{employeeId}")]
        public async Task<ActionResult<AttendanceResponseDto>> GetTodayAttendance(int employeeId)
        {
            var todayUtc = DateTime.UtcNow.Date;

            var record = await _context.AttendanceRecords
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.AttendanceDate == todayUtc);

            if (record == null)
            {
                return Ok(new AttendanceResponseDto
                {
                    EmployeeId = employeeId,
                    AttendanceDate = todayUtc.ToString("yyyy-MM-dd"),
                    Status = "NOT_PUNCHED_IN",
                    Message = "No attendance recorded for today."
                });
            }

            return Ok(MapToResponseDto(record, "Retrieved successfully"));
        }

        [HttpPost("punch-in")]
        public async Task<ActionResult<AttendanceResponseDto>> PunchIn([FromBody] PunchRequestDto request)
        {
            var emp = await _context.Employees.FindAsync(request.EmployeeId);
            if (emp == null || !emp.IsActive)
            {
                return BadRequest(new { code = "INVALID_EMPLOYEE", message = "Employee not found or inactive." });
            }

            var todayUtc = DateTime.UtcNow.Date;
            var existingRecord = await _context.AttendanceRecords
                .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId && a.AttendanceDate == todayUtc);

            if (existingRecord != null && (existingRecord.Status == "PUNCHED_IN" || existingRecord.Status == "PUNCHED_OUT"))
            {
                return BadRequest(new { code = "ALREADY_PUNCHED_IN", message = "You have already punched in for today." });
            }

            // Accuracy check
            var maxAccuracy = GetMaxAccuracyMeters();
            if (request.Accuracy > maxAccuracy && request.Accuracy > 0)
            {
                return BadRequest(new { code = "LOCATION_ACCURACY_TOO_LOW", message = $"Unable to determine your location accurately ({request.Accuracy:F1}m). Please move to an open area and try again." });
            }

            // Haversine distance validation
            double officeLat = GetOfficeLatitude();
            double officeLng = GetOfficeLongitude();
            double allowedRadius = GetAttendanceRadiusMeters();
            double distanceMeters = CalculateHaversineDistanceMeters(request.Latitude, request.Longitude, officeLat, officeLng);

            if (distanceMeters > allowedRadius)
            {
                return BadRequest(new { code = "OUTSIDE_ATTENDANCE_AREA", message = $"You are outside the allowed attendance area. Distance: {distanceMeters:F1}m (Allowed: {allowedRadius:F1}m)." });
            }

            // Photo validation & save
            if (string.IsNullOrWhiteSpace(request.PhotoBase64))
            {
                return BadRequest(new { code = "PHOTO_REQUIRED", message = "Attendance photo is required." });
            }

            string photoUrl;
            try
            {
                photoUrl = await SavePhotoAsync(request.PhotoBase64, request.EmployeeId, "punch_in");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save Punch In photo.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { code = "PHOTO_SAVE_FAILED", message = "Failed to process attendance photo." });
            }

            // Reverse Geocoding via Google API
            var address = await _geocodingService.GetAddressFromCoordinatesAsync(request.Latitude, request.Longitude);

            var nowUtc = DateTime.UtcNow;
            if (existingRecord == null)
            {
                existingRecord = new AttendanceRecord
                {
                    EmployeeId = request.EmployeeId,
                    AttendanceDate = todayUtc,
                    PunchInTime = nowUtc,
                    PunchInLatitude = request.Latitude,
                    PunchInLongitude = request.Longitude,
                    PunchInAccuracy = request.Accuracy,
                    PunchInDistance = Math.Round(distanceMeters, 1),
                    PunchInAddress = address,
                    PunchInPhotoUrl = photoUrl,
                    Status = "PUNCHED_IN",
                    CreatedAt = nowUtc,
                    UpdatedAt = nowUtc
                };
                _context.AttendanceRecords.Add(existingRecord);
            }
            else
            {
                existingRecord.PunchInTime = nowUtc;
                existingRecord.PunchInLatitude = request.Latitude;
                existingRecord.PunchInLongitude = request.Longitude;
                existingRecord.PunchInAccuracy = request.Accuracy;
                existingRecord.PunchInDistance = Math.Round(distanceMeters, 1);
                existingRecord.PunchInAddress = address;
                existingRecord.PunchInPhotoUrl = photoUrl;
                existingRecord.Status = "PUNCHED_IN";
                existingRecord.UpdatedAt = nowUtc;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Employee ID {EmpId} successfully Punched IN at {Time}.", request.EmployeeId, nowUtc);

            return Ok(MapToResponseDto(existingRecord, "Punch In Successful"));
        }

        [HttpPost("punch-out")]
        public async Task<ActionResult<AttendanceResponseDto>> PunchOut([FromBody] PunchRequestDto request)
        {
            var emp = await _context.Employees.FindAsync(request.EmployeeId);
            if (emp == null || !emp.IsActive)
            {
                return BadRequest(new { code = "INVALID_EMPLOYEE", message = "Employee not found or inactive." });
            }

            var todayUtc = DateTime.UtcNow.Date;
            var existingRecord = await _context.AttendanceRecords
                .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId && a.AttendanceDate == todayUtc);

            if (existingRecord == null || existingRecord.Status == "NOT_PUNCHED_IN")
            {
                return BadRequest(new { code = "NOT_PUNCHED_IN", message = "You must Punch In before you can Punch Out." });
            }

            if (existingRecord.Status == "PUNCHED_OUT")
            {
                return BadRequest(new { code = "ALREADY_PUNCHED_OUT", message = "You have already punched out for today." });
            }

            // Accuracy check
            var maxAccuracy = GetMaxAccuracyMeters();
            if (request.Accuracy > maxAccuracy && request.Accuracy > 0)
            {
                return BadRequest(new { code = "LOCATION_ACCURACY_TOO_LOW", message = $"Unable to determine your location accurately ({request.Accuracy:F1}m). Please move to an open area and try again." });
            }

            // Haversine distance validation
            double officeLat = GetOfficeLatitude();
            double officeLng = GetOfficeLongitude();
            double allowedRadius = GetAttendanceRadiusMeters();
            double distanceMeters = CalculateHaversineDistanceMeters(request.Latitude, request.Longitude, officeLat, officeLng);

            if (distanceMeters > allowedRadius)
            {
                return BadRequest(new { code = "OUTSIDE_ATTENDANCE_AREA", message = $"You are outside the allowed attendance area. Distance: {distanceMeters:F1}m (Allowed: {allowedRadius:F1}m)." });
            }

            // Photo validation & save
            if (string.IsNullOrWhiteSpace(request.PhotoBase64))
            {
                return BadRequest(new { code = "PHOTO_REQUIRED", message = "Attendance photo is required." });
            }

            string photoUrl;
            try
            {
                photoUrl = await SavePhotoAsync(request.PhotoBase64, request.EmployeeId, "punch_out");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save Punch Out photo.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { code = "PHOTO_SAVE_FAILED", message = "Failed to process attendance photo." });
            }

            // Reverse Geocoding via Google API
            var address = await _geocodingService.GetAddressFromCoordinatesAsync(request.Latitude, request.Longitude);

            var nowUtc = DateTime.UtcNow;
            existingRecord.PunchOutTime = nowUtc;
            existingRecord.PunchOutLatitude = request.Latitude;
            existingRecord.PunchOutLongitude = request.Longitude;
            existingRecord.PunchOutAccuracy = request.Accuracy;
            existingRecord.PunchOutDistance = Math.Round(distanceMeters, 1);
            existingRecord.PunchOutAddress = address;
            existingRecord.PunchOutPhotoUrl = photoUrl;
            existingRecord.Status = "PUNCHED_OUT";
            existingRecord.UpdatedAt = nowUtc;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Employee ID {EmpId} successfully Punched OUT at {Time}.", request.EmployeeId, nowUtc);

            return Ok(MapToResponseDto(existingRecord, "Punch Out Successful"));
        }

        private async Task<string> SavePhotoAsync(string base64Data, int employeeId, string type)
        {
            if (base64Data.Contains(","))
            {
                base64Data = base64Data.Substring(base64Data.IndexOf(",") + 1);
            }

            byte[] imageBytes = Convert.FromBase64String(base64Data);

            var wwwroot = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(wwwroot, "uploads", "attendance");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"att_emp_{employeeId}_{type}_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid().ToString().Substring(0, 6)}.jpg";
            var filePath = Path.Combine(uploadsFolder, fileName);

            await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);

            return $"/uploads/attendance/{fileName}";
        }

        private double CalculateHaversineDistanceMeters(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371000; // Earth radius in meters
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private double ToRadians(double val) => (Math.PI / 180) * val;

        private AttendanceResponseDto MapToResponseDto(AttendanceRecord record, string message)
        {
            return new AttendanceResponseDto
            {
                Id = record.Id,
                EmployeeId = record.EmployeeId,
                AttendanceDate = record.AttendanceDate.ToString("yyyy-MM-dd"),
                Status = record.Status,
                PunchInTime = record.PunchInTime,
                PunchInLatitude = record.PunchInLatitude,
                PunchInLongitude = record.PunchInLongitude,
                PunchInAddress = record.PunchInAddress,
                PunchInAccuracy = record.PunchInAccuracy,
                PunchInDistance = record.PunchInDistance,
                PunchInPhotoUrl = record.PunchInPhotoUrl,
                PunchOutTime = record.PunchOutTime,
                PunchOutLatitude = record.PunchOutLatitude,
                PunchOutLongitude = record.PunchOutLongitude,
                PunchOutAddress = record.PunchOutAddress,
                PunchOutAccuracy = record.PunchOutAccuracy,
                PunchOutDistance = record.PunchOutDistance,
                PunchOutPhotoUrl = record.PunchOutPhotoUrl,
                Message = message
            };
        }
    }
}
