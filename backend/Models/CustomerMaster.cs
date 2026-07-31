using System;

namespace NavbharatAgroAPI.Models
{
    public class CustomerMaster
    {
        public int Id { get; set; }

        public string CustomerId { get; set; } = string.Empty; // Business ID e.g. CUST-2026-001

        public string CustomerCode { get; set; } = string.Empty; // Code e.g. CUST0001

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

        public string Status { get; set; } = "Active"; // Active, Inactive

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
