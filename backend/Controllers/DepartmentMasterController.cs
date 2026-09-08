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
    [Route("api/master/departments")]
    [ApiController]
    public class DepartmentMasterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DepartmentMasterController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentMasterResponseDto>>> GetDepartments()
        {
            var deps = await _context.DepartmentMasters
                .OrderBy(d => d.Id)
                .Select(d => new DepartmentMasterResponseDto
                {
                    Id = d.Id,
                    DepartmentName = d.DepartmentName,
                    DepartmentCode = d.DepartmentCode,
                    IsActive = d.IsActive,
                    CreatedAt = d.CreatedAt
                })
                .ToListAsync();

            return Ok(deps);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DepartmentMasterResponseDto>> GetDepartment(int id)
        {
            var d = await _context.DepartmentMasters.FindAsync(id);
            if (d == null) return NotFound(new { message = "Department not found" });

            return Ok(new DepartmentMasterResponseDto
            {
                Id = d.Id,
                DepartmentName = d.DepartmentName,
                DepartmentCode = d.DepartmentCode,
                IsActive = d.IsActive,
                CreatedAt = d.CreatedAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<DepartmentMasterResponseDto>> CreateDepartment(DepartmentMasterRequestDto dto)
        {
            if (await _context.DepartmentMasters.AnyAsync(d => d.DepartmentCode == dto.DepartmentCode))
            {
                return BadRequest(new { message = $"Department code '{dto.DepartmentCode}' already exists." });
            }

            var dept = new DepartmentMaster
            {
                DepartmentName = dto.DepartmentName,
                DepartmentCode = dto.DepartmentCode,
                IsActive = dto.IsActive
            };

            _context.DepartmentMasters.Add(dept);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDepartment), new { id = dept.Id }, new DepartmentMasterResponseDto
            {
                Id = dept.Id,
                DepartmentName = dept.DepartmentName,
                DepartmentCode = dept.DepartmentCode,
                IsActive = dept.IsActive,
                CreatedAt = dept.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, DepartmentMasterRequestDto dto)
        {
            var dept = await _context.DepartmentMasters.FindAsync(id);
            if (dept == null) return NotFound(new { message = "Department not found" });

            if (await _context.DepartmentMasters.AnyAsync(d => d.DepartmentCode == dto.DepartmentCode && d.Id != id))
            {
                return BadRequest(new { message = $"Department code '{dto.DepartmentCode}' already in use by another department." });
            }

            dept.DepartmentName = dto.DepartmentName;
            dept.DepartmentCode = dto.DepartmentCode;
            dept.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Department updated successfully" });
        }

        [HttpPut("{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var dept = await _context.DepartmentMasters.FindAsync(id);
            if (dept == null) return NotFound(new { message = "Department not found" });

            dept.IsActive = !dept.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Department status updated to {(dept.IsActive ? "Active" : "Inactive")}" });
        }
    }
}
