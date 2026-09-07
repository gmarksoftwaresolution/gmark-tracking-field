using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.Models;
using NavbharatAgroAPI.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    /// <summary>
    /// Manages Employee records in the Navbharat Agro system.
    /// </summary>
    [Route("api/employees")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<EmployeeController> _logger;

        public EmployeeController(AppDbContext context, ILogger<EmployeeController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371e3; // metres
            var p1 = lat1 * Math.PI / 180;
            var p2 = lat2 * Math.PI / 180;
            var dp = (lat2 - lat1) * Math.PI / 180;
            var dl = (lon2 - lon1) * Math.PI / 180;

            var a = Math.Sin(dp / 2) * Math.Sin(dp / 2) +
                    Math.Cos(p1) * Math.Cos(p2) *
                    Math.Sin(dl / 2) * Math.Sin(dl / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
        }

        private TimeZoneInfo GetIstTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            }
        }

        /// <summary>
        /// Retrieves a list of all employees.
        /// </summary>
        /// <returns>A list of EmployeeResponseDto.</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<EmployeeResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<EmployeeResponseDto>>> GetEmployees()
        {
            try
            {
                var employees = await _context.Employees
                    .Where(e => e.EmployeeCode != "EMP002" && (e.Name == null || !e.Name.ToLower().Contains("prutivraj")))
                    .ToListAsync();

                // Group by normalized name (stripping ' Employee' and whitespace) and select first per unique name
                var uniqueEmployees = employees
                    .GroupBy(e => (e.Name ?? "").Replace(" Employee", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower())
                    .Select(g => g.First())
                    .OrderBy(e => e.Id)
                    .ToList();

                var uniqueEmployeeIds = uniqueEmployees.Select(e => e.Id).ToList();
                var istZone = GetIstTimeZone();
                var todayIst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone).Date;
                var todayUtcStart = TimeZoneInfo.ConvertTimeToUtc(todayIst, istZone);
                var todayUtcEnd = todayUtcStart.AddDays(1);

                var todayPings = await _context.LocationHistories
                    .Where(lh => uniqueEmployeeIds.Contains(lh.EmployeeId) && lh.Timestamp >= todayUtcStart && lh.Timestamp < todayUtcEnd)
                    .OrderBy(lh => lh.Timestamp)
                    .ToListAsync();

                var pingsByEmployee = todayPings.GroupBy(p => p.EmployeeId).ToDictionary(g => g.Key, g => g.ToList());

                return Ok(uniqueEmployees.Select(e => {
                    bool isToday = e.TripStartTime.HasValue && e.TripStartTime.Value.ToLocalTime().Date == DateTime.Now.Date;
                    int stoppedDurationMinutes = e.LastMovementTimestamp.HasValue && e.LastLocationTimestamp.HasValue 
                        ? (int)(e.LastLocationTimestamp.Value - e.LastMovementTimestamp.Value).TotalMinutes 
                        : 0;

                    var stops = new List<HistoricalStopDto>();
                    if (pingsByEmployee.TryGetValue(e.Id, out var pings) && pings.Count > 0)
                    {
                        var currentStopStart = pings[0];
                        var lastPing = pings[0];

                        for (int i = 1; i < pings.Count; i++)
                        {
                            var ping = pings[i];
                            double distance = CalculateDistance(lastPing.Latitude, lastPing.Longitude, ping.Latitude, ping.Longitude);
                            
                            if (distance >= 15) // Moved!
                            {
                                var duration = (lastPing.Timestamp - currentStopStart.Timestamp).TotalMinutes;
                                if (duration >= 30)
                                {
                                    stops.Add(new HistoricalStopDto {
                                        Latitude = currentStopStart.Latitude,
                                        Longitude = currentStopStart.Longitude,
                                        StartTime = currentStopStart.Timestamp,
                                        EndTime = lastPing.Timestamp,
                                        DurationMinutes = (int)duration
                                    });
                                }
                                currentStopStart = ping;
                            }
                            lastPing = ping;
                        }
                        
                        var finalDuration = (lastPing.Timestamp - currentStopStart.Timestamp).TotalMinutes;
                        if (finalDuration >= 30)
                        {
                            stops.Add(new HistoricalStopDto {
                                Latitude = currentStopStart.Latitude,
                                Longitude = currentStopStart.Longitude,
                                StartTime = currentStopStart.Timestamp,
                                EndTime = lastPing.Timestamp,
                                DurationMinutes = (int)finalDuration
                            });
                        }
                    }

                    return new EmployeeResponseDto
                    {
                        Id = e.Id,
                        Name = e.Name,
                        EmployeeCode = e.EmployeeCode,
                        MobileNumber = e.MobileNumber,
                        AssignedArea = e.AssignedArea,
                        TripStatus = isToday ? (e.TripStatus ?? "Not Started") : "Not Started",
                        TripStartTime = isToday ? e.TripStartTime : null,
                        TripEndTime = isToday ? e.TripEndTime : null,
                        SelectedRouteCode = e.SelectedRouteCode,
                        CreatedAt = e.CreatedAt,
                        Message = "Retrieved Successfully",
                        LastLatitude = e.LastLatitude,
                        LastLongitude = e.LastLongitude,
                        LastLocationTimestamp = e.LastLocationTimestamp,
                        LastKnownAddress = e.LastKnownAddress,
                        TodayTravelledDistance = e.TodayTravelledDistance,
                        StoppedDurationMinutes = stoppedDurationMinutes,
                        LastMovementTimestamp = e.LastMovementTimestamp,
                        HistoricalStops = stops
                    };
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting all employees.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred.", details = ex.Message, inner = ex.InnerException?.Message });
            }
        }

        /// <summary>
        /// Retrieves a specific employee by their unique ID.
        /// </summary>
        /// <param name="id">The unique identifier of the employee.</param>
        /// <returns>The EmployeeResponseDto.</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(EmployeeResponseDto))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<EmployeeResponseDto>> GetEmployee(int id)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);

                if (employee == null)
                {
                    _logger.LogWarning("GetEmployee: Employee with Id {Id} was not found.", id);
                    return NotFound(new { message = $"Employee with Id {id} not found." });
                }

                bool isToday = employee.TripStartTime.HasValue && employee.TripStartTime.Value.ToLocalTime().Date == DateTime.Now.Date;

                return Ok(new EmployeeResponseDto
                {
                    Id = employee.Id,
                    Name = employee.Name,
                    EmployeeCode = employee.EmployeeCode,
                    MobileNumber = employee.MobileNumber,
                    AssignedArea = employee.AssignedArea,
                    TripStatus = isToday ? (employee.TripStatus ?? "Not Started") : "Not Started",
                    TripStartTime = isToday ? employee.TripStartTime : null,
                    TripEndTime = isToday ? employee.TripEndTime : null,
                    SelectedRouteCode = employee.SelectedRouteCode,
                    CreatedAt = employee.CreatedAt,
                    Message = "Retrieved Successfully",
                    LastLatitude = employee.LastLatitude,
                    LastLongitude = employee.LastLongitude,
                    LastLocationTimestamp = employee.LastLocationTimestamp,
                    LastKnownAddress = employee.LastKnownAddress,
                    TodayTravelledDistance = employee.TodayTravelledDistance
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting employee with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Creates a new employee record.
        /// </summary>
        /// <param name="requestDto">The details of the new employee.</param>
        /// <returns>The created EmployeeResponseDto.</returns>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(EmployeeResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<EmployeeResponseDto>> PostEmployee(EmployeeRequestDto requestDto)
        {
            try
            {
                if (EmployeeExists(requestDto.Id))
                {
                    _logger.LogWarning("PostEmployee: Attempted to create duplicate employee with Id {Id}.", requestDto.Id);
                    return Conflict(new { message = $"Employee with Id {requestDto.Id} already exists." });
                }

                string rawPasswordToHash = "0000";

                if (!string.IsNullOrWhiteSpace(requestDto.Password))
                {
                    if (!IsAdminRequest())
                    {
                        _logger.LogWarning("PostEmployee: Unauthorized attempt to set employee password for Id {Id}.", requestDto.Id);
                        return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden: Only Admin users can set employee passwords." });
                    }

                    var (isValid, errorMessage) = ValidatePassword(requestDto.Password, requestDto.ConfirmPassword);
                    if (!isValid)
                    {
                        return BadRequest(new { message = errorMessage });
                    }

                    rawPasswordToHash = requestDto.Password;
                }

                var employee = new Employee
                {
                    Id = requestDto.Id,
                    Name = requestDto.Name,
                    EmployeeCode = requestDto.EmployeeCode,
                    MobileNumber = requestDto.MobileNumber,
                    AssignedArea = requestDto.AssignedArea,
                    CreatedAt = DateTime.UtcNow,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(rawPasswordToHash),
                    IsActive = true
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                var responseDto = new EmployeeResponseDto
                {
                    Id = employee.Id,
                    Name = employee.Name,
                    EmployeeCode = employee.EmployeeCode,
                    MobileNumber = employee.MobileNumber,
                    AssignedArea = employee.AssignedArea,
                    CreatedAt = employee.CreatedAt,
                    Message = "Employee Created Successfully"
                };

                _logger.LogInformation("Employee with Id {Id} created successfully.", employee.Id);
                return CreatedAtAction(nameof(GetEmployee), new { id = employee.Id }, responseDto);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "PostEmployee: Database update exception. Likely a duplicate EmployeeCode or constraint violation.");
                return Conflict(new { message = "A database conflict occurred. Please ensure EmployeeCode is unique.", details = ex.InnerException?.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating a new employee.");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Updates an existing employee's details.
        /// </summary>
        /// <param name="id">The unique identifier of the employee to update.</param>
        /// <param name="requestDto">The updated employee details.</param>
        /// <returns>A success message.</returns>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(EmployeeResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<EmployeeResponseDto>> PutEmployee(int id, EmployeeRequestDto requestDto)
        {
            if (id != requestDto.Id)
            {
                _logger.LogWarning("PutEmployee: Route Id ({RouteId}) and Request Body Id ({BodyId}) do not match.", id, requestDto.Id);
                return BadRequest(new { message = "Route Id and Request Body Id do not match." });
            }

            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    _logger.LogWarning("PutEmployee: Employee with Id {Id} not found.", id);
                    return NotFound(new { message = $"Employee with Id {id} not found." });
                }

                employee.Name = requestDto.Name;
                employee.EmployeeCode = requestDto.EmployeeCode;
                employee.MobileNumber = requestDto.MobileNumber;
                employee.AssignedArea = requestDto.AssignedArea;

                _context.Entry(employee).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var responseDto = new EmployeeResponseDto
                {
                    Id = employee.Id,
                    Name = employee.Name,
                    EmployeeCode = employee.EmployeeCode,
                    MobileNumber = employee.MobileNumber,
                    AssignedArea = employee.AssignedArea,
                    CreatedAt = employee.CreatedAt,
                    Message = "Employee Updated Successfully"
                };

                _logger.LogInformation("Employee with Id {Id} updated successfully.", id);
                return Ok(responseDto);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex, "PutEmployee: Concurrency exception for Employee Id {Id}.", id);
                return NotFound(new { message = $"Employee with Id {id} not found during update." });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "PutEmployee: Database update exception for Employee Id {Id}. Likely a duplicate EmployeeCode.", id);
                return Conflict(new { message = "A database conflict occurred. Please ensure EmployeeCode is unique.", details = ex.InnerException?.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating employee with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Deletes an employee from the system.
        /// </summary>
        /// <param name="id">The unique identifier of the employee to delete.</param>
        /// <returns>No content on success.</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    _logger.LogWarning("DeleteEmployee: Employee with Id {Id} not found.", id);
                    return NotFound(new { message = $"Employee with Id {id} not found." });
                }

                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Employee with Id {Id} deleted successfully.", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting employee with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Starts trip for an employee and records start time and route code.
        /// </summary>
        [HttpPut("{id}/start-trip")]
        public async Task<ActionResult<EmployeeResponseDto>> StartTrip(int id, [FromBody] StartTripRequestDto? request)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    return NotFound(new { message = $"Employee with Id {id} not found." });
                }

                employee.TripStatus = "Started";
                employee.TripStartTime = DateTime.UtcNow;
                employee.TripEndTime = null;
                if (!string.IsNullOrWhiteSpace(request?.RouteCode))
                {
                    employee.SelectedRouteCode = request.RouteCode;
                }

                await _context.SaveChangesAsync();

                return Ok(new EmployeeResponseDto
                {
                    Id = employee.Id,
                    Name = employee.Name,
                    EmployeeCode = employee.EmployeeCode,
                    MobileNumber = employee.MobileNumber,
                    AssignedArea = employee.AssignedArea,
                    TripStatus = employee.TripStatus,
                    TripStartTime = employee.TripStartTime,
                    TripEndTime = employee.TripEndTime,
                    SelectedRouteCode = employee.SelectedRouteCode,
                    CreatedAt = employee.CreatedAt,
                    Message = "Trip Started Successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while starting trip for employee Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Stops trip for an employee and records end time.
        /// </summary>
        [HttpPut("{id}/stop-trip")]
        public async Task<ActionResult<EmployeeResponseDto>> StopTrip(int id)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    return NotFound(new { message = $"Employee with Id {id} not found." });
                }

                employee.TripStatus = "Stopped";
                employee.TripEndTime = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new EmployeeResponseDto
                {
                    Id = employee.Id,
                    Name = employee.Name,
                    EmployeeCode = employee.EmployeeCode,
                    MobileNumber = employee.MobileNumber,
                    AssignedArea = employee.AssignedArea,
                    TripStatus = employee.TripStatus,
                    TripStartTime = employee.TripStartTime,
                    TripEndTime = employee.TripEndTime,
                    SelectedRouteCode = employee.SelectedRouteCode,
                    CreatedAt = employee.CreatedAt,
                    Message = "Trip Stopped Successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while stopping trip for employee Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Saves custom route for an employee without starting the trip.
        /// </summary>
        [HttpPut("{id}/save-route")]
        public async Task<ActionResult<EmployeeResponseDto>> SaveRoute(int id, [FromBody] StartTripRequestDto? request)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    return NotFound(new { message = $"Employee with Id {id} not found." });
                }

                if (!string.IsNullOrWhiteSpace(request?.RouteCode))
                {
                    employee.SelectedRouteCode = request.RouteCode;
                }

                await _context.SaveChangesAsync();

                bool isToday = employee.TripStartTime.HasValue && employee.TripStartTime.Value.ToLocalTime().Date == DateTime.Now.Date;

                return Ok(new EmployeeResponseDto
                {
                    Id = employee.Id,
                    Name = employee.Name,
                    EmployeeCode = employee.EmployeeCode,
                    MobileNumber = employee.MobileNumber,
                    AssignedArea = employee.AssignedArea,
                    TripStatus = isToday ? (employee.TripStatus ?? "Not Started") : "Not Started",
                    TripStartTime = isToday ? employee.TripStartTime : null,
                    TripEndTime = isToday ? employee.TripEndTime : null,
                    SelectedRouteCode = employee.SelectedRouteCode,
                    CreatedAt = employee.CreatedAt,
                    Message = "Route Saved Successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while saving route for employee Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Resets an existing employee's password (Admin only).
        /// </summary>
        [HttpPost("{id}/reset-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordDto requestDto)
        {
            if (!IsAdminRequest())
            {
                _logger.LogWarning("ResetPassword: Unauthorized attempt to reset password for Employee Id {Id}.", id);
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden: Only Admin users can reset employee passwords." });
            }

            var (isValid, errorMessage) = ValidatePassword(requestDto?.Password, requestDto?.ConfirmPassword);
            if (!isValid)
            {
                return BadRequest(new { message = errorMessage });
            }

            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    _logger.LogWarning("ResetPassword: Employee with Id {Id} not found.", id);
                    return NotFound(new { message = $"Employee with Id {id} not found." });
                }

                employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(requestDto!.Password);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Password reset successfully for Employee Id {Id}.", id);
                return Ok(new { message = "Employee Password Reset Successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while resetting password for employee Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        private bool IsAdminRequest()
        {
            if (Request.Headers.TryGetValue("X-User-Role", out var roleHeader))
            {
                return string.Equals(roleHeader.ToString(), "Admin", StringComparison.OrdinalIgnoreCase);
            }
            return false;
        }

        private static (bool IsValid, string ErrorMessage) ValidatePassword(string? password, string? confirmPassword)
        {
            if (string.IsNullOrWhiteSpace(password))
                return (false, "Password is required.");

            if (password != confirmPassword)
                return (false, "Password and Confirm Password must match.");

            if (password.Length < 8)
                return (false, "Password must be at least 8 characters long.");

            if (!password.Any(char.IsUpper))
                return (false, "Password must contain at least one uppercase letter.");

            if (!password.Any(char.IsLower))
                return (false, "Password must contain at least one lowercase letter.");

            if (!password.Any(char.IsDigit))
                return (false, "Password must contain at least one number.");

            if (!password.Any(ch => !char.IsLetterOrDigit(ch)))
                return (false, "Password must contain at least one special character.");

            return (true, string.Empty);
        }

        private bool EmployeeExists(int id)
        {
            return _context.Employees.Any(e => e.Id == id);
        }
    }
}
