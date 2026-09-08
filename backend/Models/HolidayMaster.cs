using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NavbharatAgroAPI.Models
{
    public class HolidayMaster
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string HolidayName { get; set; } = string.Empty;

        [Required]
        public DateTime HolidayDate { get; set; }

        [Required]
        [StringLength(30)]
        public string HolidayType { get; set; } = "Company"; // National, Regional, Company

        public int? BranchId { get; set; }

        [ForeignKey(nameof(BranchId))]
        public BranchMaster? Branch { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
