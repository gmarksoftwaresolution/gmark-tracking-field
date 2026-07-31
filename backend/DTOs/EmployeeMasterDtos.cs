using System;
using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class EmployeeMasterRequestDto
    {
        public int Id { get; set; }

        public string? EmployeeCode { get; set; } // Will be auto-generated if empty/null

        public string? EmployeeId { get; set; } // Business ID e.g. EMP-2026-001

        [Required(ErrorMessage = "First Name is required.")]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? MiddleName { get; set; }

        [Required(ErrorMessage = "Last Name is required.")]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Gender { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        [Required(ErrorMessage = "Mobile Number is required.")]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Mobile Number must be exactly 10 digits.")]
        public string MobileNumber { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Invalid Email Address format.")]
        public string? EmailAddress { get; set; }

        public string? Password { get; set; }

        public string? ProfilePhoto { get; set; }

        // Company Info Lookups
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }

        public int? DesignationId { get; set; }
        public string? DesignationName { get; set; }

        public int? RoleId { get; set; }
        public string? RoleName { get; set; }

        public int? BranchId { get; set; }
        public string? BranchName { get; set; }

        public string? ReportingManager { get; set; }

        public DateOnly? DateOfJoining { get; set; }

        public string? EmploymentType { get; set; } // Permanent, Contract, Intern, Probation

        public string EmployeeStatus { get; set; } = "Active"; // Active, Inactive

        // Address
        public string? CurrentAddress { get; set; }
        public string? PermanentAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }

        // Identity Docs
        public string? AadhaarNumber { get; set; }
        public string? PanNumber { get; set; }
        public string? DrivingLicenceNumber { get; set; }

        // Emergency Contact
        public string? EmergencyContactName { get; set; }
        public string? Relationship { get; set; }
        public string? EmergencyContactNumber { get; set; }
    }

    public class EmployeeMasterResponseDto
    {
        public int Id { get; set; }
        public string EmployeeCode { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Gender { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string MobileNumber { get; set; } = string.Empty;
        public string? EmailAddress { get; set; }
        public string? ProfilePhoto { get; set; }

        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public int? DesignationId { get; set; }
        public string? DesignationName { get; set; }
        public int? RoleId { get; set; }
        public string? RoleName { get; set; }
        public int? BranchId { get; set; }
        public string? BranchName { get; set; }

        public string? ReportingManager { get; set; }
        public DateOnly? DateOfJoining { get; set; }
        public string? EmploymentType { get; set; }
        public string EmployeeStatus { get; set; } = "Active";

        public string? CurrentAddress { get; set; }
        public string? PermanentAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }

        public string? AadhaarNumber { get; set; }
        public string? PanNumber { get; set; }
        public string? DrivingLicenceNumber { get; set; }

        public string? EmergencyContactName { get; set; }
        public string? Relationship { get; set; }
        public string? EmergencyContactNumber { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
