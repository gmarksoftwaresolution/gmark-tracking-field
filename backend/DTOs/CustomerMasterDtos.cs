using System;
using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class CustomerMasterRequestDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Customer ID is required.")]
        public string CustomerId { get; set; } = string.Empty; // e.g. CUST-2026-001

        // Temporary validation for testing only. Full validation will be restored later.
        public string? CustomerCode { get; set; } // e.g. CUST0001

        [Required(ErrorMessage = "Customer Name is required.")]
        [StringLength(150)]
        public string CustomerName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mobile Number is required.")]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Mobile Number must be exactly 10 digits.")]
        public string MobileNumber { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Invalid Email format.")]
        public string? Email { get; set; }

        public string? CustomerCategory { get; set; }

        public string? Address { get; set; }

        public string? Village { get; set; }

        public string? Taluka { get; set; }

        public string? District { get; set; }

        public string? State { get; set; }

        public string? Pincode { get; set; }

        public string Status { get; set; } = "Active";
    }

    public class CustomerMasterResponseDto
    {
        public int Id { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public string CustomerCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? CustomerCategory { get; set; }
        public string? Address { get; set; }
        public string? Village { get; set; }
        public string? Taluka { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
