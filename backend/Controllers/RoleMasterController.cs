using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using NavbharatAgroAPI.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    [Route("api/master/roles")]
    [ApiController]
    public class RoleMasterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoleMasterController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoleMasterResponseDto>>> GetRoles()
        {
            var roles = await _context.RoleMasters
                .Include(r => r.RolePermissions)
                .OrderBy(r => r.Id)
                .Select(r => new RoleMasterResponseDto
                {
                    Id = r.Id,
                    RoleName = r.RoleName,
                    RoleCode = r.RoleCode,
                    Description = r.Description,
                    IsActive = r.IsActive,
                    CreatedAt = r.CreatedAt,
                    AssignedPermissionIds = r.RolePermissions.Select(rp => rp.PermissionId).ToList()
                })
                .ToListAsync();

            return Ok(roles);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RoleMasterResponseDto>> GetRole(int id)
        {
            var r = await _context.RoleMasters
                .Include(rm => rm.RolePermissions)
                .FirstOrDefaultAsync(rm => rm.Id == id);

            if (r == null) return NotFound(new { message = "Role not found" });

            return Ok(new RoleMasterResponseDto
            {
                Id = r.Id,
                RoleName = r.RoleName,
                RoleCode = r.RoleCode,
                Description = r.Description,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt,
                AssignedPermissionIds = r.RolePermissions.Select(rp => rp.PermissionId).ToList()
            });
        }

        [HttpPost]
        public async Task<ActionResult<RoleMasterResponseDto>> CreateRole(RoleMasterRequestDto dto)
        {
            if (await _context.RoleMasters.AnyAsync(r => r.RoleCode == dto.RoleCode))
            {
                return BadRequest(new { message = $"Role code '{dto.RoleCode}' already exists." });
            }

            var role = new RoleMaster
            {
                RoleName = dto.RoleName,
                RoleCode = dto.RoleCode,
                Description = dto.Description,
                IsActive = dto.IsActive
            };

            _context.RoleMasters.Add(role);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRole), new { id = role.Id }, new RoleMasterResponseDto
            {
                Id = role.Id,
                RoleName = role.RoleName,
                RoleCode = role.RoleCode,
                Description = role.Description,
                IsActive = role.IsActive,
                CreatedAt = role.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(int id, RoleMasterRequestDto dto)
        {
            var role = await _context.RoleMasters.FindAsync(id);
            if (role == null) return NotFound(new { message = "Role not found" });

            if (await _context.RoleMasters.AnyAsync(r => r.RoleCode == dto.RoleCode && r.Id != id))
            {
                return BadRequest(new { message = $"Role code '{dto.RoleCode}' already in use by another role." });
            }

            role.RoleName = dto.RoleName;
            role.RoleCode = dto.RoleCode;
            role.Description = dto.Description;
            role.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Role updated successfully" });
        }

        [HttpPut("{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var role = await _context.RoleMasters.FindAsync(id);
            if (role == null) return NotFound(new { message = "Role not found" });

            role.IsActive = !role.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Role status updated to {(role.IsActive ? "Active" : "Inactive")}" });
        }

        [HttpPost("{id}/permissions")]
        public async Task<IActionResult> AssignPermissions(int id, AssignPermissionsDto dto)
        {
            var role = await _context.RoleMasters.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Id == id);
            if (role == null) return NotFound(new { message = "Role not found" });

            _context.RolePermissions.RemoveRange(role.RolePermissions);

            if (dto.PermissionIds != null && dto.PermissionIds.Any())
            {
                var validPermissionIds = await _context.PermissionMasters
                    .Where(p => dto.PermissionIds.Contains(p.Id))
                    .Select(p => p.Id)
                    .ToListAsync();

                foreach (var pid in validPermissionIds)
                {
                    _context.RolePermissions.Add(new RolePermission { RoleId = id, PermissionId = pid });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Permissions updated successfully" });
        }
    }
}
