using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    [Route("api/lookups")]
    [ApiController]
    public class MasterLookupController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MasterLookupController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("departments")]
        public async Task<ActionResult<IEnumerable<LookupDto>>> GetDepartments()
        {
            var list = await _context.Departments
                .Where(d => d.IsActive)
                .Select(d => new LookupDto { Id = d.Id, Name = d.Name, Code = d.Code, IsActive = d.IsActive })
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("designations")]
        public async Task<ActionResult<IEnumerable<LookupDto>>> GetDesignations()
        {
            var list = await _context.Designations
                .Where(d => d.IsActive)
                .Select(d => new LookupDto { Id = d.Id, Name = d.Name, Code = d.Code, IsActive = d.IsActive })
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("roles")]
        public async Task<ActionResult<IEnumerable<LookupDto>>> GetRoles()
        {
            var list = await _context.RoleMasters
                .Where(r => r.IsActive)
                .Select(r => new LookupDto { Id = r.Id, Name = r.Name, Code = r.Code, IsActive = r.IsActive })
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("branches")]
        public async Task<ActionResult<IEnumerable<LookupDto>>> GetBranches()
        {
            var list = await _context.Branches
                .Where(b => b.IsActive)
                .Select(b => new LookupDto { Id = b.Id, Name = b.Name, Code = b.Code, City = b.City, IsActive = b.IsActive })
                .ToListAsync();
            return Ok(list);
        }
    }
}
