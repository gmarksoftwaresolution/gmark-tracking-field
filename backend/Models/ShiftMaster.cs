using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace NavbharatAgroAPI.Models
{
    public class ShiftMaster
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string ShiftName { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string ShiftCode { get; set; } = string.Empty;

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        public int BreakDurationMinutes { get; set; } = 60;

        public int GracePeriodMinutes { get; set; } = 15;

        public double HalfDayHoursThreshold { get; set; } = 4.5;

        public double FullDayHoursThreshold { get; set; } = 8.0;

        public bool IsOvernight { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    }
}
