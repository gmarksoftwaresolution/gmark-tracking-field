using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NavbharatAgroAPI.Models
{
    public class AttendanceRecord
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [ForeignKey(nameof(EmployeeId))]
        public Employee? Employee { get; set; }

        [Required]
        public DateTime AttendanceDate { get; set; } // UTC Midnight Date

        // --- Punch In Fields ---
        public DateTime? PunchInTime { get; set; }
        public double? PunchInLatitude { get; set; }
        public double? PunchInLongitude { get; set; }

        [StringLength(250)]
        public string? PunchInAddress { get; set; }
        public double? PunchInAccuracy { get; set; }
        public double? PunchInDistance { get; set; }

        [StringLength(500)]
        public string? PunchInPhotoUrl { get; set; }

        // --- Punch Out Fields ---
        public DateTime? PunchOutTime { get; set; }
        public double? PunchOutLatitude { get; set; }
        public double? PunchOutLongitude { get; set; }

        [StringLength(250)]
        public string? PunchOutAddress { get; set; }
        public double? PunchOutAccuracy { get; set; }
        public double? PunchOutDistance { get; set; }

        [StringLength(500)]
        public string? PunchOutPhotoUrl { get; set; }

        // --- Status: NOT_PUNCHED_IN, PUNCHED_IN, PUNCHED_OUT ---
        [Required]
        [StringLength(30)]
        public string Status { get; set; } = "NOT_PUNCHED_IN";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
