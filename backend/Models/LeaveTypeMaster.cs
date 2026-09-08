using System;
using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.Models
{
    public class LeaveTypeMaster
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string LeaveTypeName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string LeaveTypeCode { get; set; } = string.Empty;

        public int MaxDaysPerYear { get; set; } = 12;

        public bool IsPaid { get; set; } = true;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
