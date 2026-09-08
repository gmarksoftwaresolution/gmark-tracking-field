using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class LeaveTypeMasterRequestDto
    {
        [Required]
        [StringLength(50)]
        public string LeaveTypeName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string LeaveTypeCode { get; set; } = string.Empty;

        [Range(0, 365, ErrorMessage = "Max days per year must be between 0 and 365.")]
        public int MaxDaysPerYear { get; set; } = 12;

        public bool IsPaid { get; set; } = true;

        public bool IsActive { get; set; } = true;
    }

    public class LeaveTypeMasterResponseDto
    {
        public int Id { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public string LeaveTypeCode { get; set; } = string.Empty;
        public int MaxDaysPerYear { get; set; }
        public bool IsPaid { get; set; }
        public bool IsActive { get; set; }
        public System.DateTime CreatedAt { get; set; }
    }
}
