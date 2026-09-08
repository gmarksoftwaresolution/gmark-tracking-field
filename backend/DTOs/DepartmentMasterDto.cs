using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class DepartmentMasterRequestDto
    {
        [Required]
        [StringLength(100)]
        public string DepartmentName { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string DepartmentCode { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }

    public class DepartmentMasterResponseDto
    {
        public int Id { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string DepartmentCode { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public System.DateTime CreatedAt { get; set; }
    }
}
