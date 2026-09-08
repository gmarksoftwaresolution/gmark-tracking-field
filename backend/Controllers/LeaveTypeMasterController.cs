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
    [Route("api/master/leave-types")]
    [ApiController]
    public class LeaveTypeMasterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaveTypeMasterController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaveTypeMasterResponseDto>>> GetLeaveTypes()
        {
            var leaves = await _context.LeaveTypeMasters
                .OrderBy(l => l.Id)
                .Select(l => new LeaveTypeMasterResponseDto
                {
                    Id = l.Id,
                    LeaveTypeName = l.LeaveTypeName,
                    LeaveTypeCode = l.LeaveTypeCode,
                    MaxDaysPerYear = l.MaxDaysPerYear,
                    IsPaid = l.IsPaid,
                    IsActive = l.IsActive,
                    CreatedAt = l.CreatedAt
                })
                .ToListAsync();

            return Ok(leaves);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LeaveTypeMasterResponseDto>> GetLeaveType(int id)
        {
            var l = await _context.LeaveTypeMasters.FindAsync(id);
            if (l == null) return NotFound(new { message = "Leave Type not found" });

            return Ok(new LeaveTypeMasterResponseDto
            {
                Id = l.Id,
                LeaveTypeName = l.LeaveTypeName,
                LeaveTypeCode = l.LeaveTypeCode,
                MaxDaysPerYear = l.MaxDaysPerYear,
                IsPaid = l.IsPaid,
                IsActive = l.IsActive,
                CreatedAt = l.CreatedAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<LeaveTypeMasterResponseDto>> CreateLeaveType(LeaveTypeMasterRequestDto dto)
        {
            if (await _context.LeaveTypeMasters.AnyAsync(l => l.LeaveTypeCode == dto.LeaveTypeCode))
            {
                return BadRequest(new { message = $"Leave Type code '{dto.LeaveTypeCode}' already exists." });
            }

            var leave = new LeaveTypeMaster
            {
                LeaveTypeName = dto.LeaveTypeName,
                LeaveTypeCode = dto.LeaveTypeCode,
                MaxDaysPerYear = dto.MaxDaysPerYear,
                IsPaid = dto.IsPaid,
                IsActive = dto.IsActive
            };

            _context.LeaveTypeMasters.Add(leave);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLeaveType), new { id = leave.Id }, new LeaveTypeMasterResponseDto
            {
                Id = leave.Id,
                LeaveTypeName = leave.LeaveTypeName,
                LeaveTypeCode = leave.LeaveTypeCode,
                MaxDaysPerYear = leave.MaxDaysPerYear,
                IsPaid = leave.IsPaid,
                IsActive = leave.IsActive,
                CreatedAt = leave.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLeaveType(int id, LeaveTypeMasterRequestDto dto)
        {
            var leave = await _context.LeaveTypeMasters.FindAsync(id);
            if (leave == null) return NotFound(new { message = "Leave Type not found" });

            if (await _context.LeaveTypeMasters.AnyAsync(l => l.LeaveTypeCode == dto.LeaveTypeCode && l.Id != id))
            {
                return BadRequest(new { message = $"Leave Type code '{dto.LeaveTypeCode}' already in use by another leave type." });
            }

            leave.LeaveTypeName = dto.LeaveTypeName;
            leave.LeaveTypeCode = dto.LeaveTypeCode;
            leave.MaxDaysPerYear = dto.MaxDaysPerYear;
            leave.IsPaid = dto.IsPaid;
            leave.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Leave Type updated successfully" });
        }

        [HttpPut("{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var leave = await _context.LeaveTypeMasters.FindAsync(id);
            if (leave == null) return NotFound(new { message = "Leave Type not found" });

            leave.IsActive = !leave.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Leave Type status updated to {(leave.IsActive ? "Active" : "Inactive")}" });
        }
    }
}
