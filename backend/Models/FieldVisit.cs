using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NavbharatAgroAPI.Models
{
    public class FieldVisit
    {
        [Key]
        public int Id { get; set; }

        public int? EmployeeId { get; set; }
        
        public SalesEmployee? Employee { get; set; }

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

        public int? ProductId { get; set; }
        
        public Product? Product { get; set; }

        [StringLength(500)]
        public string? ProductNames { get; set; }

        [StringLength(500)]
        public string? ShortNote { get; set; }

        public double? Latitude { get; set; }
        
        public double? Longitude { get; set; }

        public DateOnly VisitDate { get; set; }

        public TimeOnly VisitTime { get; set; }
    }
}
