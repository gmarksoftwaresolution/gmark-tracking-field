using System;
using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class HolidayMasterRequestDto
    {
        [Required]
        [StringLength(100)]
        public string HolidayName { get; set; } = string.Empty;

        [Required]
        public DateTime HolidayDate { get; set; }

        [Required]
        [StringLength(30)]
        public string HolidayType { get; set; } = "Company"; // National, Regional, Company

        public int? BranchId { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class HolidayMasterResponseDto
    {
        public int Id { get; set; }
        public string HolidayName { get; set; } = string.Empty;
        public DateTime HolidayDate { get; set; }
        public string HolidayType { get; set; } = string.Empty;
        public int? BranchId { get; set; }
        public string? BranchName { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
