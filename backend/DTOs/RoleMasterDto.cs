using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace NavbharatAgroAPI.DTOs
{
    public class RoleMasterRequestDto
    {
        [Required]
        [StringLength(50)]
        public string RoleName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string RoleCode { get; set; } = string.Empty;

        [StringLength(250)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class RoleMasterResponseDto
    {
        public int Id { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string RoleCode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public System.DateTime CreatedAt { get; set; }
        public List<int> AssignedPermissionIds { get; set; } = new List<int>();
    }

    public class AssignPermissionsDto
    {
        [Required]
        public List<int> PermissionIds { get; set; } = new List<int>();
    }
}
