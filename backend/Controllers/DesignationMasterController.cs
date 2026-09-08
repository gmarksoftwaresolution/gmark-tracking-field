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
    [Route("api/master/designations")]
    [ApiController]
    public class DesignationMasterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DesignationMasterController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DesignationMasterResponseDto>>> GetDesignations()
        {
            var desgs = await _context.DesignationMasters
                .OrderBy(d => d.Id)
                .Select(d => new DesignationMasterResponseDto
                {
                    Id = d.Id,
                    DesignationName = d.DesignationName,
                    DesignationCode = d.DesignationCode,
                    IsActive = d.IsActive,
                    CreatedAt = d.CreatedAt
                })
                .ToListAsync();

            return Ok(desgs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DesignationMasterResponseDto>> GetDesignation(int id)
        {
            var d = await _context.DesignationMasters.FindAsync(id);
            if (d == null) return NotFound(new { message = "Designation not found" });

            return Ok(new DesignationMasterResponseDto
            {
                Id = d.Id,
                DesignationName = d.DesignationName,
                DesignationCode = d.DesignationCode,
                IsActive = d.IsActive,
                CreatedAt = d.CreatedAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<DesignationMasterResponseDto>> CreateDesignation(DesignationMasterRequestDto dto)
        {
            if (await _context.DesignationMasters.AnyAsync(d => d.DesignationCode == dto.DesignationCode))
            {
                return BadRequest(new { message = $"Designation code '{dto.DesignationCode}' already exists." });
            }

            var desg = new DesignationMaster
            {
                DesignationName = dto.DesignationName,
                DesignationCode = dto.DesignationCode,
                IsActive = dto.IsActive
            };

            _context.DesignationMasters.Add(desg);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDesignation), new { id = desg.Id }, new DesignationMasterResponseDto
            {
                Id = desg.Id,
                DesignationName = desg.DesignationName,
                DesignationCode = desg.DesignationCode,
                IsActive = desg.IsActive,
                CreatedAt = desg.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDesignation(int id, DesignationMasterRequestDto dto)
        {
            var desg = await _context.DesignationMasters.FindAsync(id);
            if (desg == null) return NotFound(new { message = "Designation not found" });

            if (await _context.DesignationMasters.AnyAsync(d => d.DesignationCode == dto.DesignationCode && d.Id != id))
            {
                return BadRequest(new { message = $"Designation code '{dto.DesignationCode}' already in use by another designation." });
            }

            desg.DesignationName = dto.DesignationName;
            desg.DesignationCode = dto.DesignationCode;
            desg.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Designation updated successfully" });
        }

        [HttpPut("{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var desg = await _context.DesignationMasters.FindAsync(id);
            if (desg == null) return NotFound(new { message = "Designation not found" });

            desg.IsActive = !desg.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Designation status updated to {(desg.IsActive ? "Active" : "Inactive")}" });
        }
    }
}
