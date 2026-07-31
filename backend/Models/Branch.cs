using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.Models
{
    public class Branch
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Code { get; set; } = string.Empty;

        [StringLength(100)]
        public string? City { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
