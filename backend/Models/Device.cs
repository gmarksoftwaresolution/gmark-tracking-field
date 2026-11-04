using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NavbharatAgroAPI.Models
{
    public enum DeviceStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2,
        Revoked = 3
    }

    public class Device
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public int EmployeeId { get; set; }
        
        [ForeignKey(nameof(EmployeeId))]
        [JsonIgnore]
        public virtual Employee Employee { get; set; } = null!;

        [Required]
        [MaxLength(128)]
        public string DeviceId { get; set; } = string.Empty; // Persistent UUID/Unique identifier

        [MaxLength(128)]
        public string? DeviceName { get; set; } // e.g. "Samsung Galaxy S23", "iPhone 15 Pro"

        [MaxLength(256)]
        public string? PushToken { get; set; }

        public DeviceStatus Status { get; set; } = DeviceStatus.Pending;

        // Request Context
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? LocationName { get; set; }
        public string? Reason { get; set; }

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ActionAt { get; set; }
        public string? ActionBy { get; set; } // Admin email/username who approved/rejected

        public DateTime LastUsed { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Refresh token for persistent login
        [MaxLength(256)]
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
    }
}

