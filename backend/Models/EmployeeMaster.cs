using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NavbharatAgroAPI.Models
{
    public class EmployeeMaster
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string EmployeeCode { get; set; } = string.Empty; // e.g. EMP0001

        [StringLength(50)]
        public string? EmployeeId { get; set; } // Business Identifier e.g. EMP-2026-001

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? MiddleName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [StringLength(300)]
        public string FullName { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Gender { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        [Required]
        [StringLength(15)]
        public string MobileNumber { get; set; } = string.Empty;

        [StringLength(100)]
        public string? EmailAddress { get; set; }

        public string? PasswordHash { get; set; }

        [StringLength(500)]
        public string? ProfilePhoto { get; set; } // Image URL/path

        // Company Information & Master Lookups
        public int? DepartmentId { get; set; }
        [ForeignKey("DepartmentId")]
        public Department? Department { get; set; }
        [StringLength(100)]
        public string? DepartmentName { get; set; }

        public int? DesignationId { get; set; }
        [ForeignKey("DesignationId")]
        public Designation? Designation { get; set; }
        [StringLength(100)]
        public string? DesignationName { get; set; }

        public int? RoleId { get; set; }
        [ForeignKey("RoleId")]
        public RoleMaster? RoleMaster { get; set; }
        [StringLength(100)]
        public string? RoleName { get; set; }

        public int? BranchId { get; set; }
        [ForeignKey("BranchId")]
        public Branch? Branch { get; set; }
        [StringLength(100)]
        public string? BranchName { get; set; }

        [StringLength(100)]
        public string? ReportingManager { get; set; }

        public DateOnly? DateOfJoining { get; set; }

        [StringLength(50)]
        public string? EmploymentType { get; set; } // Permanent, Contract, Intern, Probation

        [StringLength(20)]
        public string EmployeeStatus { get; set; } = "Active"; // Active, Inactive

        // Address Information
        [StringLength(500)]
        public string? CurrentAddress { get; set; }

        [StringLength(500)]
        public string? PermanentAddress { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? State { get; set; }

        [StringLength(20)]
        public string? Pincode { get; set; }

        // Identity Documents
        [StringLength(20)]
        public string? AadhaarNumber { get; set; }

        [StringLength(20)]
        public string? PanNumber { get; set; }

        [StringLength(50)]
        public string? DrivingLicenceNumber { get; set; }

        // Emergency Contact
        [StringLength(100)]
        public string? EmergencyContactName { get; set; }

        [StringLength(50)]
        public string? Relationship { get; set; }

        [StringLength(15)]
        public string? EmergencyContactNumber { get; set; }

        // Audit Fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [StringLength(100)]
        public string? CreatedBy { get; set; }

        [StringLength(100)]
        public string? UpdatedBy { get; set; }
    }
}
