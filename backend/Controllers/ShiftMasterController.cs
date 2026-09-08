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
    [Route("api/master/shifts")]
    [ApiController]
    public class ShiftMasterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ShiftMasterController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ShiftMasterResponseDto>>> GetShifts()
        {
            var shifts = await _context.ShiftMasters
                .OrderBy(s => s.Id)
                .Select(s => new ShiftMasterResponseDto
                {
                    Id = s.Id,
                    ShiftName = s.ShiftName,
                    ShiftCode = s.ShiftCode,
                    StartTime = s.StartTime.ToString(@"hh\:mm"),
                    EndTime = s.EndTime.ToString(@"hh\:mm"),
                    BreakDurationMinutes = s.BreakDurationMinutes,
                    GracePeriodMinutes = s.GracePeriodMinutes,
                    HalfDayHoursThreshold = s.HalfDayHoursThreshold,
                    FullDayHoursThreshold = s.FullDayHoursThreshold,
                    IsOvernight = s.IsOvernight,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();

            return Ok(shifts);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ShiftMasterResponseDto>> GetShift(int id)
        {
            var s = await _context.ShiftMasters.FindAsync(id);
            if (s == null) return NotFound(new { message = "Shift not found" });

            return Ok(new ShiftMasterResponseDto
            {
                Id = s.Id,
                ShiftName = s.ShiftName,
                ShiftCode = s.ShiftCode,
                StartTime = s.StartTime.ToString(@"hh\:mm"),
                EndTime = s.EndTime.ToString(@"hh\:mm"),
                BreakDurationMinutes = s.BreakDurationMinutes,
                GracePeriodMinutes = s.GracePeriodMinutes,
                HalfDayHoursThreshold = s.HalfDayHoursThreshold,
                FullDayHoursThreshold = s.FullDayHoursThreshold,
                IsOvernight = s.IsOvernight,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<ShiftMasterResponseDto>> CreateShift(ShiftMasterRequestDto dto)
        {
            if (await _context.ShiftMasters.AnyAsync(s => s.ShiftCode == dto.ShiftCode))
            {
                return BadRequest(new { message = $"Shift code '{dto.ShiftCode}' already exists." });
            }

            if (!TimeSpan.TryParse(dto.StartTime, out var startTime) || !TimeSpan.TryParse(dto.EndTime, out var endTime))
            {
                return BadRequest(new { message = "Invalid StartTime or EndTime format. Please use HH:mm." });
            }

            var shift = new ShiftMaster
            {
                ShiftName = dto.ShiftName,
                ShiftCode = dto.ShiftCode,
                StartTime = startTime,
                EndTime = endTime,
                BreakDurationMinutes = dto.BreakDurationMinutes,
                GracePeriodMinutes = dto.GracePeriodMinutes,
                HalfDayHoursThreshold = dto.HalfDayHoursThreshold,
                FullDayHoursThreshold = dto.FullDayHoursThreshold,
                IsOvernight = dto.IsOvernight,
                IsActive = dto.IsActive
            };

            _context.ShiftMasters.Add(shift);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetShift), new { id = shift.Id }, new ShiftMasterResponseDto
            {
                Id = shift.Id,
                ShiftName = shift.ShiftName,
                ShiftCode = shift.ShiftCode,
                StartTime = shift.StartTime.ToString(@"hh\:mm"),
                EndTime = shift.EndTime.ToString(@"hh\:mm"),
                BreakDurationMinutes = shift.BreakDurationMinutes,
                GracePeriodMinutes = shift.GracePeriodMinutes,
                HalfDayHoursThreshold = shift.HalfDayHoursThreshold,
                FullDayHoursThreshold = shift.FullDayHoursThreshold,
                IsOvernight = shift.IsOvernight,
                IsActive = shift.IsActive,
                CreatedAt = shift.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateShift(int id, ShiftMasterRequestDto dto)
        {
            var shift = await _context.ShiftMasters.FindAsync(id);
            if (shift == null) return NotFound(new { message = "Shift not found" });

            if (await _context.ShiftMasters.AnyAsync(s => s.ShiftCode == dto.ShiftCode && s.Id != id))
            {
                return BadRequest(new { message = $"Shift code '{dto.ShiftCode}' already in use by another shift." });
            }

            if (!TimeSpan.TryParse(dto.StartTime, out var startTime) || !TimeSpan.TryParse(dto.EndTime, out var endTime))
            {
                return BadRequest(new { message = "Invalid StartTime or EndTime format. Please use HH:mm." });
            }

            shift.ShiftName = dto.ShiftName;
            shift.ShiftCode = dto.ShiftCode;
            shift.StartTime = startTime;
            shift.EndTime = endTime;
            shift.BreakDurationMinutes = dto.BreakDurationMinutes;
            shift.GracePeriodMinutes = dto.GracePeriodMinutes;
            shift.HalfDayHoursThreshold = dto.HalfDayHoursThreshold;
            shift.FullDayHoursThreshold = dto.FullDayHoursThreshold;
            shift.IsOvernight = dto.IsOvernight;
            shift.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Shift updated successfully" });
        }

        [HttpPut("{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var shift = await _context.ShiftMasters.FindAsync(id);
            if (shift == null) return NotFound(new { message = "Shift not found" });

            shift.IsActive = !shift.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Shift status updated to {(shift.IsActive ? "Active" : "Inactive")}" });
        }
    }
}
