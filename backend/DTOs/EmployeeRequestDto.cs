using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class EmployeeRequestDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string EmployeeCode { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Invalid Mobile Number. It must be exactly 10 digits.")]
        public string MobileNumber { get; set; } = string.Empty;

        [StringLength(100)]
        public string? AssignedArea { get; set; }

        public string? Password { get; set; }

        public string? ConfirmPassword { get; set; }
    }
}
