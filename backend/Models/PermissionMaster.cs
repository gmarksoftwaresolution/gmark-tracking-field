using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace NavbharatAgroAPI.Models
{
    public class PermissionMaster
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string PermissionName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string PermissionCode { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Module { get; set; } = string.Empty;

        [StringLength(250)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}
