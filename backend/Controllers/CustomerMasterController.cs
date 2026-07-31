using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using NavbharatAgroAPI.Models;

namespace NavbharatAgroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerMasterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomerMasterController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/customermaster
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerMasterResponseDto>>> GetCustomerMasters(
            [FromQuery] string? search = null,
            [FromQuery] string? status = null)
        {
            var query = _context.CustomerMasters.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.Trim().ToLower();
                query = query.Where(c =>
                    c.CustomerName.ToLower().Contains(searchLower) ||
                    c.CustomerCode.ToLower().Contains(searchLower) ||
                    c.CustomerId.ToLower().Contains(searchLower) ||
                    c.MobileNumber.Contains(searchLower) ||
                    (c.Village != null && c.Village.ToLower().Contains(searchLower)) ||
                    (c.District != null && c.District.ToLower().Contains(searchLower)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(c => c.Status.ToLower() == status.Trim().ToLower());
            }

            var list = await query
                .OrderByDescending(c => c.Id)
                .Select(c => MapToResponseDto(c, "Success"))
                .ToListAsync();

            return Ok(list);
        }

        // GET: api/customermaster/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerMasterResponseDto>> GetCustomerMaster(int id)
        {
            var item = await _context.CustomerMasters.FindAsync(id);
            if (item == null)
            {
                return NotFound(new { message = $"Customer with ID {id} not found." });
            }

            return Ok(MapToResponseDto(item, "Success"));
        }

        // GET: api/customermaster/next-code
        [HttpGet("next-code")]
        public async Task<ActionResult<object>> GetNextCustomerCode()
        {
            var maxId = await _context.CustomerMasters.AnyAsync()
                ? await _context.CustomerMasters.MaxAsync(c => c.Id)
                : 0;

            var nextNumber = maxId + 1;
            var nextCode = $"CUST{nextNumber:D4}"; // CUST0001, CUST0002...
            var nextBusinessId = $"CUST-{DateTime.UtcNow.Year}-{nextNumber:D3}"; // CUST-2026-001

            return Ok(new { nextCode, nextBusinessId });
        }

        // POST: api/customermaster
        [HttpPost]
        public async Task<ActionResult<CustomerMasterResponseDto>> CreateCustomerMaster([FromBody] CustomerMasterRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 1. Check duplicate CustomerCode
            if (!string.IsNullOrWhiteSpace(dto.CustomerCode))
            {
                var existsCode = await _context.CustomerMasters
                    .AnyAsync(c => c.CustomerCode.ToLower() == dto.CustomerCode.Trim().ToLower());
                if (existsCode)
                {
                    return BadRequest(new { message = $"Customer Code '{dto.CustomerCode}' is already registered." });
                }
            }
            else
            {
                // Auto generate code
                var maxId = await _context.CustomerMasters.AnyAsync() ? await _context.CustomerMasters.MaxAsync(c => c.Id) : 0;
                dto.CustomerCode = $"CUST{(maxId + 1):D4}";
            }

            // 2. Check duplicate CustomerId
            if (!string.IsNullOrWhiteSpace(dto.CustomerId))
            {
                var existsId = await _context.CustomerMasters
                    .AnyAsync(c => c.CustomerId.ToLower() == dto.CustomerId.Trim().ToLower());
                if (existsId)
                {
                    return BadRequest(new { message = $"Customer ID '{dto.CustomerId}' is already registered." });
                }
            }
            else
            {
                var maxId = await _context.CustomerMasters.AnyAsync() ? await _context.CustomerMasters.MaxAsync(c => c.Id) : 0;
                dto.CustomerId = $"CUST-{DateTime.UtcNow.Year}-{(maxId + 1):D3}";
            }

            var entity = new CustomerMaster
            {
                CustomerId = dto.CustomerId.Trim(),
                CustomerCode = dto.CustomerCode.Trim(),
                CustomerName = dto.CustomerName.Trim(),
                MobileNumber = dto.MobileNumber.Trim(),
                Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
                CustomerCategory = string.IsNullOrWhiteSpace(dto.CustomerCategory) ? null : dto.CustomerCategory.Trim(),
                Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim(),
                Village = string.IsNullOrWhiteSpace(dto.Village) ? null : dto.Village.Trim(),
                Taluka = string.IsNullOrWhiteSpace(dto.Taluka) ? null : dto.Taluka.Trim(),
                District = string.IsNullOrWhiteSpace(dto.District) ? null : dto.District.Trim(),
                State = string.IsNullOrWhiteSpace(dto.State) ? null : dto.State.Trim(),
                Pincode = string.IsNullOrWhiteSpace(dto.Pincode) ? null : dto.Pincode.Trim(),
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.CustomerMasters.Add(entity);
            await _context.SaveChangesAsync();

            var responseDto = MapToResponseDto(entity, "Customer Master Created Successfully");
            return CreatedAtAction(nameof(GetCustomerMaster), new { id = entity.Id }, responseDto);
        }

        // PUT: api/customermaster/5
        [HttpPut("{id}")]
        public async Task<ActionResult<CustomerMasterResponseDto>> UpdateCustomerMaster(int id, [FromBody] CustomerMasterRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var entity = await _context.CustomerMasters.FindAsync(id);
            if (entity == null)
            {
                return NotFound(new { message = $"Customer with ID {id} not found." });
            }

            // Duplicate checks for code/id
            if (!string.IsNullOrWhiteSpace(dto.CustomerCode) && dto.CustomerCode.Trim().ToLower() != entity.CustomerCode.ToLower())
            {
                var exists = await _context.CustomerMasters.AnyAsync(c => c.Id != id && c.CustomerCode.ToLower() == dto.CustomerCode.Trim().ToLower());
                if (exists)
                {
                    return BadRequest(new { message = $"Customer Code '{dto.CustomerCode}' is already registered." });
                }
                entity.CustomerCode = dto.CustomerCode.Trim();
            }

            if (!string.IsNullOrWhiteSpace(dto.CustomerId) && dto.CustomerId.Trim().ToLower() != entity.CustomerId.ToLower())
            {
                var exists = await _context.CustomerMasters.AnyAsync(c => c.Id != id && c.CustomerId.ToLower() == dto.CustomerId.Trim().ToLower());
                if (exists)
                {
                    return BadRequest(new { message = $"Customer ID '{dto.CustomerId}' is already registered." });
                }
                entity.CustomerId = dto.CustomerId.Trim();
            }

            entity.CustomerName = dto.CustomerName.Trim();
            entity.MobileNumber = dto.MobileNumber.Trim();
            entity.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
            entity.CustomerCategory = string.IsNullOrWhiteSpace(dto.CustomerCategory) ? null : dto.CustomerCategory.Trim();
            entity.Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim();
            entity.Village = string.IsNullOrWhiteSpace(dto.Village) ? null : dto.Village.Trim();
            entity.Taluka = string.IsNullOrWhiteSpace(dto.Taluka) ? null : dto.Taluka.Trim();
            entity.District = string.IsNullOrWhiteSpace(dto.District) ? null : dto.District.Trim();
            entity.State = string.IsNullOrWhiteSpace(dto.State) ? null : dto.State.Trim();
            entity.Pincode = string.IsNullOrWhiteSpace(dto.Pincode) ? null : dto.Pincode.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Status)) entity.Status = dto.Status.Trim();

            await _context.SaveChangesAsync();

            return Ok(MapToResponseDto(entity, "Customer Master Updated Successfully"));
        }

        // DELETE: api/customermaster/5
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCustomerMaster(int id)
        {
            var entity = await _context.CustomerMasters.FindAsync(id);
            if (entity == null)
            {
                return NotFound(new { message = $"Customer with ID {id} not found." });
            }

            _context.CustomerMasters.Remove(entity);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Customer Master record deleted successfully." });
        }

        private static CustomerMasterResponseDto MapToResponseDto(CustomerMaster c, string message)
        {
            return new CustomerMasterResponseDto
            {
                Id = c.Id,
                CustomerId = c.CustomerId,
                CustomerCode = c.CustomerCode,
                CustomerName = c.CustomerName,
                MobileNumber = c.MobileNumber,
                Email = c.Email,
                CustomerCategory = c.CustomerCategory,
                Address = c.Address,
                Village = c.Village,
                Taluka = c.Taluka,
                District = c.District,
                State = c.State,
                Pincode = c.Pincode,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                Message = message
            };
        }
    }
}
