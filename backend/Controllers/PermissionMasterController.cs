using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    [Route("api/master/permissions")]
    [ApiController]
    public class PermissionMasterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PermissionMasterController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PermissionMaster>>> GetPermissions()
        {
            var permissions = await _context.PermissionMasters.OrderBy(p => p.Module).ThenBy(p => p.Id).ToListAsync();
            return Ok(permissions);
        }
    }
}
