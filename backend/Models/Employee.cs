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

        // Master Data Associations (Nullable / Optional)
        public int? RoleId { get; set; }
        [ForeignKey(nameof(RoleId))]
        public RoleMaster? Role { get; set; }

        public int? BranchId { get; set; }
        [ForeignKey(nameof(BranchId))]
        public BranchMaster? Branch { get; set; }

        public int? DepartmentId { get; set; }
        [ForeignKey(nameof(DepartmentId))]
        public DepartmentMaster? Department { get; set; }

        public int? DesignationId { get; set; }
        [ForeignKey(nameof(DesignationId))]
        public DesignationMaster? Designation { get; set; }

        public int? ShiftId { get; set; }
        [ForeignKey(nameof(ShiftId))]
        public ShiftMaster? Shift { get; set; }

        public DateTime? JoiningDate { get; set; }
        [StringLength(30)]
        public string? EmploymentStatus { get; set; } = "Active";

        [JsonIgnore]
        public ICollection<OrderBooking> OrderBookings { get; set; } = new List<OrderBooking>();
        
        [JsonIgnore]
        public ICollection<FieldVisit> FieldVisits { get; set; } = new List<FieldVisit>();
    }
}
