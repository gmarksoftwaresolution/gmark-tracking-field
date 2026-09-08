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
    [Route("api/master/branches")]
    [ApiController]
    public class BranchMasterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BranchMasterController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BranchMasterResponseDto>>> GetBranches()
        {
            var branches = await _context.BranchMasters
                .OrderBy(b => b.Id)
                .Select(b => new BranchMasterResponseDto
                {
                    Id = b.Id,
                    BranchName = b.BranchName,
                    BranchCode = b.BranchCode,
                    City = b.City,
                    State = b.State,
                    IsActive = b.IsActive,
                    CreatedAt = b.CreatedAt
                })
                .ToListAsync();

            return Ok(branches);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BranchMasterResponseDto>> GetBranch(int id)
        {
            var b = await _context.BranchMasters.FindAsync(id);
            if (b == null) return NotFound(new { message = "Branch not found" });

            return Ok(new BranchMasterResponseDto
            {
                Id = b.Id,
                BranchName = b.BranchName,
                BranchCode = b.BranchCode,
                City = b.City,
                State = b.State,
                IsActive = b.IsActive,
                CreatedAt = b.CreatedAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<BranchMasterResponseDto>> CreateBranch(BranchMasterRequestDto dto)
        {
            if (await _context.BranchMasters.AnyAsync(b => b.BranchCode == dto.BranchCode))
            {
                return BadRequest(new { message = $"Branch code '{dto.BranchCode}' already exists." });
            }

            var branch = new BranchMaster
            {
                BranchName = dto.BranchName,
                BranchCode = dto.BranchCode,
                City = dto.City,
                State = dto.State,
                IsActive = dto.IsActive
            };

            _context.BranchMasters.Add(branch);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBranch), new { id = branch.Id }, new BranchMasterResponseDto
            {
                Id = branch.Id,
                BranchName = branch.BranchName,
                BranchCode = branch.BranchCode,
                City = branch.City,
                State = branch.State,
                IsActive = branch.IsActive,
                CreatedAt = branch.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBranch(int id, BranchMasterRequestDto dto)
        {
            var branch = await _context.BranchMasters.FindAsync(id);
            if (branch == null) return NotFound(new { message = "Branch not found" });

            if (await _context.BranchMasters.AnyAsync(b => b.BranchCode == dto.BranchCode && b.Id != id))
            {
                return BadRequest(new { message = $"Branch code '{dto.BranchCode}' already in use by another branch." });
            }

            branch.BranchName = dto.BranchName;
            branch.BranchCode = dto.BranchCode;
            branch.City = dto.City;
            branch.State = dto.State;
            branch.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Branch updated successfully" });
        }

        [HttpPut("{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var branch = await _context.BranchMasters.FindAsync(id);
            if (branch == null) return NotFound(new { message = "Branch not found" });

            branch.IsActive = !branch.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Branch status updated to {(branch.IsActive ? "Active" : "Inactive")}" });
        }
    }
}
