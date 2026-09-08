using System;
using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class ShiftMasterRequestDto
    {
        [Required]
        [StringLength(100)]
        public string ShiftName { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string ShiftCode { get; set; } = string.Empty;

        [Required]
        public string StartTime { get; set; } = "09:00:00"; // Format: HH:mm or HH:mm:ss

        [Required]
        public string EndTime { get; set; } = "18:00:00";

        [Range(0, 240, ErrorMessage = "Break duration must be between 0 and 240 minutes.")]
        public int BreakDurationMinutes { get; set; } = 60;

        [Range(0, 120, ErrorMessage = "Grace period must be between 0 and 120 minutes.")]
        public int GracePeriodMinutes { get; set; } = 15;

        [Range(0.5, 12.0, ErrorMessage = "Half-day threshold must be between 0.5 and 12 hours.")]
        public double HalfDayHoursThreshold { get; set; } = 4.5;

        [Range(1.0, 24.0, ErrorMessage = "Full-day threshold must be between 1 and 24 hours.")]
        public double FullDayHoursThreshold { get; set; } = 8.0;

        public bool IsOvernight { get; set; } = false;

        public bool IsActive { get; set; } = true;
    }

    public class ShiftMasterResponseDto
    {
        public int Id { get; set; }
        public string ShiftName { get; set; } = string.Empty;
        public string ShiftCode { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public int BreakDurationMinutes { get; set; }
        public int GracePeriodMinutes { get; set; }
        public double HalfDayHoursThreshold { get; set; }
        public double FullDayHoursThreshold { get; set; }
        public bool IsOvernight { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
