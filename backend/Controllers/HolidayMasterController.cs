using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using NavbharatAgroAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    [Route("api/master/holidays")]
    [ApiController]
    public class HolidayMasterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HolidayMasterController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HolidayMasterResponseDto>>> GetHolidays()
        {
            var holidays = await _context.HolidayMasters
                .Include(h => h.Branch)
                .OrderBy(h => h.HolidayDate)
                .Select(h => new HolidayMasterResponseDto
                {
                    Id = h.Id,
                    HolidayName = h.HolidayName,
                    HolidayDate = h.HolidayDate,
                    HolidayType = h.HolidayType,
                    BranchId = h.BranchId,
                    BranchName = h.Branch != null ? h.Branch.BranchName : null,
                    IsActive = h.IsActive,
                    CreatedAt = h.CreatedAt
                })
                .ToListAsync();

            return Ok(holidays);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<HolidayMasterResponseDto>> GetHoliday(int id)
        {
            var h = await _context.HolidayMasters
                .Include(hm => hm.Branch)
                .FirstOrDefaultAsync(hm => hm.Id == id);

            if (h == null) return NotFound(new { message = "Holiday not found" });

            return Ok(new HolidayMasterResponseDto
            {
                Id = h.Id,
                HolidayName = h.HolidayName,
                HolidayDate = h.HolidayDate,
                HolidayType = h.HolidayType,
                BranchId = h.BranchId,
                BranchName = h.Branch != null ? h.Branch.BranchName : null,
                IsActive = h.IsActive,
                CreatedAt = h.CreatedAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<HolidayMasterResponseDto>> CreateHoliday(HolidayMasterRequestDto dto)
        {
            var holiday = new HolidayMaster
            {
                HolidayName = dto.HolidayName,
                HolidayDate = dto.HolidayDate.ToUniversalTime(),
                HolidayType = dto.HolidayType,
                BranchId = dto.BranchId,
                IsActive = dto.IsActive
            };

            _context.HolidayMasters.Add(holiday);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetHoliday), new { id = holiday.Id }, new HolidayMasterResponseDto
            {
                Id = holiday.Id,
                HolidayName = holiday.HolidayName,
                HolidayDate = holiday.HolidayDate,
                HolidayType = holiday.HolidayType,
                BranchId = holiday.BranchId,
                IsActive = holiday.IsActive,
                CreatedAt = holiday.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHoliday(int id, HolidayMasterRequestDto dto)
        {
            var holiday = await _context.HolidayMasters.FindAsync(id);
            if (holiday == null) return NotFound(new { message = "Holiday not found" });

            holiday.HolidayName = dto.HolidayName;
            holiday.HolidayDate = dto.HolidayDate.ToUniversalTime();
            holiday.HolidayType = dto.HolidayType;
            holiday.BranchId = dto.BranchId;
            holiday.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Holiday updated successfully" });
        }

        [HttpPut("{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var holiday = await _context.HolidayMasters.FindAsync(id);
            if (holiday == null) return NotFound(new { message = "Holiday not found" });

            holiday.IsActive = !holiday.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Holiday status updated to {(holiday.IsActive ? "Active" : "Inactive")}" });
        }
    }
}
