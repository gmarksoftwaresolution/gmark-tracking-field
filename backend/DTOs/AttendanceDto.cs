using System;
using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class PunchRequestDto
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        public double Accuracy { get; set; }

        [Required]
        public string PhotoBase64 { get; set; } = string.Empty;

        public string? DeviceInfo { get; set; }
    }

    public class AttendanceResponseDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string AttendanceDate { get; set; } = string.Empty;
        public string Status { get; set; } = "NOT_PUNCHED_IN";

        // Punch In details
        public DateTime? PunchInTime { get; set; }
        public double? PunchInLatitude { get; set; }
        public double? PunchInLongitude { get; set; }
        public string? PunchInAddress { get; set; }
        public double? PunchInAccuracy { get; set; }
        public double? PunchInDistance { get; set; }
        public string? PunchInPhotoUrl { get; set; }

        // Punch Out details
        public DateTime? PunchOutTime { get; set; }
        public double? PunchOutLatitude { get; set; }
        public double? PunchOutLongitude { get; set; }
        public string? PunchOutAddress { get; set; }
        public double? PunchOutAccuracy { get; set; }
        public double? PunchOutDistance { get; set; }
        public string? PunchOutPhotoUrl { get; set; }

        public string Message { get; set; } = string.Empty;
    }

    public class AttendanceConfigDto
    {
        public double OfficeLatitude { get; set; }
        public double OfficeLongitude { get; set; }
        public double AttendanceRadiusMeters { get; set; }
        public double MaxLocationAccuracyMeters { get; set; }
    }
}
