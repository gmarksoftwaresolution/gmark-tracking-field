using System;
using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class FieldVisitRequestDto
    {
        public int Id { get; set; }

        public int? EmployeeId { get; set; }

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

        public int? ProductId { get; set; }

        [StringLength(500)]
        public string? ProductNames { get; set; }

        [StringLength(500)]
        public string? ShortNote { get; set; }

        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90.")]
        public double? Latitude { get; set; }

        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180.")]
        public double? Longitude { get; set; }

        [Required]
        public DateTime VisitDate { get; set; }

        [Required]
        public string VisitTime { get; set; } = string.Empty;
    }
}
