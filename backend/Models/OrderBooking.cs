using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NavbharatAgroAPI.Models
{
    public class OrderBooking
    {
        [Key]
        public int Id { get; set; }

        public int? EmployeeId { get; set; }
        
        public Employee? Employee { get; set; }

        [StringLength(100)]
        public string? AssignedBy { get; set; }

        [Required]
        [StringLength(500)]
        public string Route { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Village { get; set; }

        [Required]
        [StringLength(15)]
        public string MobileNumber { get; set; } = string.Empty;

        [StringLength(50)]
        public string? CustomerCategory { get; set; }

        [StringLength(50)]
        public string OrderStatus { get; set; } = "Pending";

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; }

        public DateOnly BookingDate { get; set; }

        public TimeOnly BookingTime { get; set; }

        [StringLength(500)]
        public string? CancellationReason { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        public ICollection<OrderProduct> OrderProducts { get; set; } = new List<OrderProduct>();
    }
}
