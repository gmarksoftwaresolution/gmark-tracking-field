using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NavbharatAgroAPI.Models
{
    public class RouteMaster
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string RouteCode { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string RouteName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string DayOfWeek { get; set; } = string.Empty;

        public int? AssignedEmployeeId { get; set; }

        [ForeignKey("AssignedEmployeeId")]
        public SalesEmployee? AssignedEmployee { get; set; }

        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
