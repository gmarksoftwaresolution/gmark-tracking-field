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
                var trimmedPassword = request.Password?.Trim();
                if (string.IsNullOrEmpty(trimmedPassword))
                {
                    return Unauthorized(new { message = "Invalid Password" });
                }

                NavbharatAgroAPI.Models.Employee matchedEmployee = null;

                // 1. If EmployeeId > 0 is provided, check that specific employee first
                if (request.EmployeeId > 0)
                {
                    var emp = await _context.Employees.FindAsync(request.EmployeeId);
                    if (emp != null && emp.IsActive && !string.IsNullOrEmpty(emp.PasswordHash))
                    {
                        try
                        {
                            if (BCrypt.Net.BCrypt.Verify(trimmedPassword, emp.PasswordHash))
                            {
                                matchedEmployee = emp;
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "BCrypt verification exception for Employee ID {EmployeeId}", request.EmployeeId);
                        }
                    }
                }

                // 2. If no direct EmployeeId match yet, search all active employees by BCrypt password hash
                if (matchedEmployee == null)
                {
                    var activeEmployees = await _context.Employees
                        .Where(e => e.IsActive && !string.IsNullOrEmpty(e.PasswordHash))
                        .ToListAsync();

                    foreach (var emp in activeEmployees)
                    {
                        try
                        {
                            if (BCrypt.Net.BCrypt.Verify(trimmedPassword, emp.PasswordHash))
                            {
                                matchedEmployee = emp;
                                break;
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "BCrypt verification exception for Employee ID {EmployeeId}", emp.Id);
                        }
                    }
                }

                if (matchedEmployee == null)
                {
                    return Unauthorized(new { message = "Invalid Password" });
                }

                var token = Guid.NewGuid().ToString();

                return Ok(new LoginResponseDto
                {
                    EmployeeId = matchedEmployee.Id,
                    EmployeeName = matchedEmployee.Name,
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
