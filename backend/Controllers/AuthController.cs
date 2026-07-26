using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using System;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AuthController> _logger;

        public AuthController(AppDbContext context, ILogger<AuthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("employee-login")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(LoginResponseDto))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<LoginResponseDto>> EmployeeLogin(LoginRequestDto request)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(request.EmployeeId);
                
                if (employee == null || !employee.IsActive)
                {
                    return Unauthorized(new { message = "Invalid Password" });
                }

                var trimmedPassword = request.Password?.Trim();
                if (string.IsNullOrEmpty(trimmedPassword) || string.IsNullOrEmpty(employee.PasswordHash))
                {
                    return Unauthorized(new { message = "Invalid Password" });
                }

                bool isValid = false;
                try
                {
                    isValid = BCrypt.Net.BCrypt.Verify(trimmedPassword, employee.PasswordHash);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "BCrypt verification exception for Employee ID {EmployeeId}", request.EmployeeId);
                    isValid = false;
                }

                if (!isValid)
                {
                    return Unauthorized(new { message = "Invalid Password" });
                }

                var token = Guid.NewGuid().ToString();

                return Ok(new LoginResponseDto
                {
                    EmployeeId = employee.Id,
                    EmployeeName = employee.Name,
                    Token = token,
                    Message = "Login Successful"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during employee login.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Server error during login." });
            }
        }

    }
}
