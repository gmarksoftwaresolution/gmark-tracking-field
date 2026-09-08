using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class DesignationMasterRequestDto
    {
        [Required]
        [StringLength(100)]
        public string DesignationName { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string DesignationCode { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }

    public class DesignationMasterResponseDto
    {
        public int Id { get; set; }
        public string DesignationName { get; set; } = string.Empty;
        public string DesignationCode { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public System.DateTime CreatedAt { get; set; }
    }
}
