using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class OrderBookingRequestDto
    {
        public int EmployeeId { get; set; }

        [StringLength(100)]
        public string? AssignedBy { get; set; }

        [StringLength(500)]
        public string? Route { get; set; } = "General Route";

        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Village { get; set; }

        [Required]
        [StringLength(15)]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Invalid Mobile Number. It must be exactly 10 digits.")]
        public string MobileNumber { get; set; } = string.Empty;

        [StringLength(50)]
        public string? CustomerCategory { get; set; }

        [Required]
        public DateTime BookingDate { get; set; }

        [Required]
        public string BookingTime { get; set; } = string.Empty;

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        public List<OrderProductRequestDto> Products { get; set; } = new List<OrderProductRequestDto>();
    }
}
