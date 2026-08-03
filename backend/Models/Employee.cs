using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;

namespace NavbharatAgroAPI.Models
{
    public class Employee
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string EmployeeCode { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        public string MobileNumber { get; set; } = string.Empty;

        [StringLength(100)]
        public string? AssignedArea { get; set; }

        [JsonIgnore]
        public string? PasswordHash { get; set; }
        
        public bool IsActive { get; set; } = true;

        public string? TripStatus { get; set; } = "Not Started";
        public DateTime? TripStartTime { get; set; }
        public DateTime? TripEndTime { get; set; }
        public string? SelectedRouteCode { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ICollection<OrderBooking> OrderBookings { get; set; } = new List<OrderBooking>();
        
        [JsonIgnore]
        public ICollection<FieldVisit> FieldVisits { get; set; } = new List<FieldVisit>();
    }
}
