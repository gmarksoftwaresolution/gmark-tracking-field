using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NavbharatAgroAPI.Models
{
    public class RolePermission
    {
        public int RoleId { get; set; }

        [ForeignKey(nameof(RoleId))]
        [JsonIgnore]
        public RoleMaster? Role { get; set; }

        public int PermissionId { get; set; }

        [ForeignKey(nameof(PermissionId))]
        public PermissionMaster? Permission { get; set; }
    }
}
