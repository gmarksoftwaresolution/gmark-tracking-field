using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class BranchMasterRequestDto
    {
        [Required]
        [StringLength(100)]
        public string BranchName { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string BranchCode { get; set; } = string.Empty;

        [StringLength(50)]
        public string? City { get; set; }

        [StringLength(50)]
        public string? State { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class BranchMasterResponseDto
    {
        public int Id { get; set; }
        public string BranchName { get; set; } = string.Empty;
        public string BranchCode { get; set; } = string.Empty;
        public string? City { get; set; }
        public string? State { get; set; }
        public bool IsActive { get; set; }
        public System.DateTime CreatedAt { get; set; }
    }
}
