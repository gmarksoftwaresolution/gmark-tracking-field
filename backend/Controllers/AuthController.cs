using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using NavbharatAgroAPI.Models;
using NavbharatAgroAPI.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AuthController> _logger;
        private readonly ITokenService _tokenService;
        private readonly IDeviceRevocationCache _revocationCache;

        public AuthController(
            AppDbContext context, 
            ILogger<AuthController> logger,
            ITokenService tokenService,
            IDeviceRevocationCache revocationCache)
        {
            _context = context;
            _logger = logger;
            _tokenService = tokenService;
            _revocationCache = revocationCache;
        }

        /// <summary>
        /// Employee Login with Single-Device Binding &amp; Approval Workflow.
        /// </summary>
        [HttpPost("login")]
        [HttpPost("employee-login")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(LoginResponseDto))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginRequestDto request)
        {
            try
            {
                var trimmedPassword = request.Password?.Trim();
                if (string.IsNullOrEmpty(trimmedPassword))
                {
                    return Unauthorized(new { message = "Invalid Password" });
                }

                Employee? matchedEmployee = null;

                // 1. Direct EmployeeId lookup if provided
                if (request.EmployeeId > 0)
                {
                    var emp = await _context.Employees.FindAsync(request.EmployeeId);
                    if (emp != null && emp.IsActive && !string.IsNullOrEmpty(emp.PasswordHash))
                    {
                        if (BCrypt.Net.BCrypt.Verify(trimmedPassword, emp.PasswordHash))
                        {
                            matchedEmployee = emp;
                        }
                    }
                }

                // 2. Or match by Employee Code / Identifier
                if (matchedEmployee == null && !string.IsNullOrEmpty(request.Identifier))
                {
                    var cleanIdentifier = request.Identifier.Trim();
                    var emp = await _context.Employees
                        .FirstOrDefaultAsync(e => e.IsActive && 
                            (e.EmployeeCode == cleanIdentifier || e.MobileNumber == cleanIdentifier || e.Name == cleanIdentifier));
                    
                    if (emp != null && !string.IsNullOrEmpty(emp.PasswordHash) && BCrypt.Net.BCrypt.Verify(trimmedPassword, emp.PasswordHash))
                    {
                        matchedEmployee = emp;
                    }
                }

                // 3. Fallback: search all active employees by password
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

                var deviceId = request.DeviceId?.Trim();
                if (string.IsNullOrEmpty(deviceId))
                {
                    // Fallback to existing or auto-generated device identifier if client did not supply one
                    deviceId = matchedEmployee.DeviceId ?? Guid.NewGuid().ToString("N");
                }

                // Note: If device was previously unlinked/revoked, we do NOT block with 401 Unauthorized.
                // Instead, we allow the employee to provide a note/reason and submit a new approval request to Admin.

                // Find device record in DB
                var existingDevice = await _context.Devices
                    .FirstOrDefaultAsync(d => d.EmployeeId == matchedEmployee.Id && d.DeviceId == deviceId);

                // Check if employee has any Approved device
                var currentApprovedDevice = await _context.Devices
                    .FirstOrDefaultAsync(d => d.EmployeeId == matchedEmployee.Id && d.Status == DeviceStatus.Approved);

                // If no device record exists in Devices table, check if legacy Employee.DeviceId matches
                if (existingDevice == null && currentApprovedDevice == null)
                {
                    if (string.IsNullOrEmpty(matchedEmployee.DeviceId) || matchedEmployee.DeviceId == deviceId)
                    {
                        var (initLat, initLng, initLoc) = ResolveLocation(request.Latitude, request.Longitude, request.LocationName, matchedEmployee);
                        // Auto-bind initial device for existing employee
                        existingDevice = new Device
                        {
                            EmployeeId = matchedEmployee.Id,
                            DeviceId = deviceId,
                            DeviceName = request.DeviceName ?? "Primary Device",
                            PushToken = request.PushToken,
                            Status = DeviceStatus.Approved,
                            Latitude = initLat,
                            Longitude = initLng,
                            LocationName = initLoc,
                            Reason = request.Reason,
                            ActionBy = "System (Initial Device)",
                            ActionAt = DateTime.UtcNow,
                            RequestedAt = DateTime.UtcNow,
                            LastUsed = DateTime.UtcNow
                        };
                        _context.Devices.Add(existingDevice);
                        matchedEmployee.DeviceId = deviceId;
                        matchedEmployee.PendingDeviceId = null;
                        matchedEmployee.DeviceChangeStatus = "Approved";
                        await _context.SaveChangesAsync();
                        currentApprovedDevice = existingDevice;
                    }
                }

                // Check if this device is APPROVED (and verify it wasn't unlinked/revoked by a newer device approval)
                if (existingDevice != null && existingDevice.Status == DeviceStatus.Approved)
                {
                    if (_revocationCache.IsDeviceRevoked(deviceId))
                    {
                        // Device was unlinked because another device was approved. Demote to Revoked in DB and proceed to request note.
                        existingDevice.Status = DeviceStatus.Revoked;
                        existingDevice.RefreshToken = null;
                        existingDevice.RefreshTokenExpiryTime = null;
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        existingDevice.LastUsed = DateTime.UtcNow;
                        if (!string.IsNullOrEmpty(request.DeviceName)) existingDevice.DeviceName = request.DeviceName;
                        if (!string.IsNullOrEmpty(request.PushToken)) existingDevice.PushToken = request.PushToken;

                        var accessToken = _tokenService.GenerateAccessToken(matchedEmployee, deviceId);
                        var refreshToken = _tokenService.GenerateRefreshToken();

                        existingDevice.RefreshToken = refreshToken;
                        existingDevice.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

                        matchedEmployee.DeviceId = deviceId;
                        matchedEmployee.DeviceChangeStatus = null;
                        matchedEmployee.PendingDeviceId = null;

                        await _context.SaveChangesAsync();

                        return Ok(new LoginResponseDto
                        {
                            Success = true,
                            IsDeviceApproved = true,
                            Status = "APPROVED",
                            EmployeeId = matchedEmployee.Id,
                            EmployeeName = matchedEmployee.Name,
                            Token = accessToken,
                            RefreshToken = refreshToken,
                            DeviceId = deviceId,
                            Message = "Login Successful",
                            Session = new
                            {
                                token = accessToken,
                                refreshToken = refreshToken,
                                employeeId = matchedEmployee.Id,
                                employeeName = matchedEmployee.Name,
                                deviceId = deviceId
                            }
                        });
                    }
                }

                // Check if this device is explicitly REJECTED
                if (existingDevice != null && existingDevice.Status == DeviceStatus.Rejected)
                {
                    return Ok(new LoginResponseDto
                    {
                        Success = false,
                        IsDeviceApproved = false,
                        Status = "REJECTED",
                        EmployeeId = matchedEmployee.Id,
                        EmployeeName = matchedEmployee.Name,
                        DeviceId = deviceId,
                        Message = "This device registration was rejected by the administrator."
                    });
                }

                // Device is not approved yet (either new or pending)
                bool hasReason = !string.IsNullOrWhiteSpace(request.Reason);
                bool deviceAlreadyHasPendingReason = existingDevice != null && existingDevice.Status == DeviceStatus.Pending && !string.IsNullOrWhiteSpace(existingDevice.Reason);

                // REQUIRE NOTE FIRST: Employee must fill the note before the request is sent to the Admin!
                if (!hasReason && !deviceAlreadyHasPendingReason)
                {
                    return Ok(new LoginResponseDto
                    {
                        Success = false,
                        IsDeviceApproved = false,
                        Status = "NOTE_REQUIRED",
                        IsDeviceChangePending = false,
                        EmployeeId = matchedEmployee.Id,
                        EmployeeName = matchedEmployee.Name,
                        DeviceId = deviceId,
                        Message = "New device detected. Please provide a note/reason for this phone change before submitting your request to the administrator."
                    });
                }

                var (resolvedLat, resolvedLng, resolvedLocName) = ResolveLocation(request.Latitude, request.Longitude, request.LocationName, matchedEmployee);

                if (existingDevice == null)
                {
                    existingDevice = new Device
                    {
                        EmployeeId = matchedEmployee.Id,
                        DeviceId = deviceId,
                        DeviceName = request.DeviceName ?? "Mobile Device",
                        PushToken = request.PushToken,
                        Status = DeviceStatus.Pending,
                        Latitude = resolvedLat,
                        Longitude = resolvedLng,
                        LocationName = resolvedLocName,
                        Reason = request.Reason?.Trim(),
                        RequestedAt = DateTime.UtcNow,
                        LastUsed = DateTime.UtcNow
                    };
                    _context.Devices.Add(existingDevice);
                }
                else
                {
                    existingDevice.Status = DeviceStatus.Pending;
                    existingDevice.DeviceName = request.DeviceName ?? existingDevice.DeviceName;
                    existingDevice.Latitude = resolvedLat;
                    existingDevice.Longitude = resolvedLng;
                    existingDevice.LocationName = resolvedLocName;
                    if (!string.IsNullOrEmpty(request.Reason)) existingDevice.Reason = request.Reason.Trim();
                    existingDevice.RequestedAt = DateTime.UtcNow;
                    existingDevice.LastUsed = DateTime.UtcNow;
                    existingDevice.ActionBy = null;
                    existingDevice.ActionAt = null;
                }

                matchedEmployee.PendingDeviceId = deviceId;
                matchedEmployee.DeviceChangeStatus = "Pending";

                // Clear any revocation cache entry so this device cleanly enters the pending approval queue
                _revocationCache.ClearRevokedDevice(deviceId);

                await _context.SaveChangesAsync();

                return Ok(new LoginResponseDto
                {
                    Success = false,
                    IsDeviceApproved = false,
                    Status = "PENDING",
                    IsDeviceChangePending = true,
                    EmployeeId = matchedEmployee.Id,
                    EmployeeName = matchedEmployee.Name,
                    DeviceId = deviceId,
                    Reason = existingDevice.Reason,
                    Message = "Device approval request submitted to administrator with your note. Please wait for admin approval."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during employee login.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Server error during login." });
            }
        }

        /// <summary>
        /// Fast Polling Endpoint: Checks whether the device has been approved by the Admin.
        /// When approved, issues full JWT and Refresh token without re-entering password.
        /// </summary>
        [HttpPost("device-status")]
        public async Task<IActionResult> GetDeviceStatus([FromBody] DeviceStatusRequestDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.DeviceId))
                {
                    return BadRequest(new { message = "DeviceId is required." });
                }

                var device = await _context.Devices
                    .Include(d => d.Employee)
                    .FirstOrDefaultAsync(d => d.DeviceId == request.DeviceId && 
                        (request.EmployeeId <= 0 || d.EmployeeId == request.EmployeeId));

                if (device == null)
                {
                    return Ok(new { status = "UNKNOWN", message = "Device request not found." });
                }

                if (device.Status == DeviceStatus.Approved)
                {
                    device.LastUsed = DateTime.UtcNow;
                    var accessToken = _tokenService.GenerateAccessToken(device.Employee, device.DeviceId);
                    var refreshToken = _tokenService.GenerateRefreshToken();

                    device.RefreshToken = refreshToken;
                    device.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        status = "APPROVED",
                        session = new
                        {
                            token = accessToken,
                            refreshToken = refreshToken,
                            employeeId = device.EmployeeId,
                            employeeName = device.Employee.Name,
                            deviceId = device.DeviceId
                        }
                    });
                }

                if (device.Status == DeviceStatus.Pending)
                {
                    return Ok(new { status = "PENDING", message = "Awaiting administrator approval." });
                }

                if (device.Status == DeviceStatus.Rejected)
                {
                    return Ok(new { status = "REJECTED", message = "Device registration rejected by administrator." });
                }

                if (device.Status == DeviceStatus.Revoked)
                {
                    return Ok(new { status = "REVOKED", message = "Device access has been revoked." });
                }

                return Ok(new { status = device.Status.ToString().ToUpperInvariant() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error querying device status.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error querying device status." });
            }
        }

        /// <summary>
        /// Submits or updates the reason for pending device approval.
        /// </summary>
        [HttpPost("submit-device-reason")]
        public async Task<IActionResult> SubmitDeviceReason([FromBody] SubmitDeviceReasonDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.DeviceId))
                {
                    return BadRequest(new { message = "DeviceId is required." });
                }

                var device = await _context.Devices
                    .FirstOrDefaultAsync(d => d.DeviceId == request.DeviceId && 
                        (request.EmployeeId <= 0 || d.EmployeeId == request.EmployeeId));

                var emp = request.EmployeeId > 0 
                    ? await _context.Employees.FindAsync(request.EmployeeId) 
                    : null;

                var (resolvedLat, resolvedLng, resolvedLocName) = ResolveLocation(request.Latitude, request.Longitude, request.LocationName, emp);

                if (device == null)
                {
                    if (emp == null)
                    {
                        return NotFound(new { message = "Device request not found." });
                    }

                    device = new Device
                    {
                        EmployeeId = emp.Id,
                        DeviceId = request.DeviceId,
                        DeviceName = "Mobile Device",
                        Status = DeviceStatus.Pending,
                        Reason = request.Reason?.Trim(),
                        Latitude = resolvedLat,
                        Longitude = resolvedLng,
                        LocationName = resolvedLocName,
                        RequestedAt = DateTime.UtcNow,
                        LastUsed = DateTime.UtcNow
                    };
                    _context.Devices.Add(device);
                }
                else
                {
                    device.Reason = request.Reason?.Trim();
                    device.Status = DeviceStatus.Pending;
                    device.Latitude = resolvedLat;
                    device.Longitude = resolvedLng;
                    device.LocationName = resolvedLocName;
                    device.RequestedAt = DateTime.UtcNow;
                    device.ActionBy = null;
                    device.ActionAt = null;
                }

                if (emp != null)
                {
                    emp.PendingDeviceId = request.DeviceId;
                    emp.DeviceChangeStatus = "Pending";
                }

                // Clear revocation cache so new request is pending admin approval
                _revocationCache.ClearRevokedDevice(request.DeviceId);

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Device request submitted to administrator with your note." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting device reason.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error submitting reason." });
            }
        }

        /// <summary>
        /// Refresh Token: Renews JWT access token using the stored refresh token so employees stay permanently logged in.
        /// </summary>
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.RefreshToken) || string.IsNullOrWhiteSpace(request.DeviceId))
                {
                    return BadRequest(new { message = "RefreshToken and DeviceId are required." });
                }

                var device = await _context.Devices
                    .Include(d => d.Employee)
                    .FirstOrDefaultAsync(d => d.DeviceId == request.DeviceId && d.EmployeeId == request.EmployeeId);

                if (device == null || device.Status != DeviceStatus.Approved)
                {
                    return Unauthorized(new { success = false, message = "Device is not approved or not registered." });
                }

                if (_revocationCache.IsDeviceRevoked(device.DeviceId))
                {
                    return Unauthorized(new { success = false, isDeviceRevoked = true, message = "Device has been unlinked." });
                }

                if (device.RefreshToken != request.RefreshToken || device.RefreshTokenExpiryTime == null || device.RefreshTokenExpiryTime <= DateTime.UtcNow)
                {
                    return Unauthorized(new { success = false, message = "Invalid or expired refresh token. Please log in again." });
                }

                // Issue new tokens
                var newAccessToken = _tokenService.GenerateAccessToken(device.Employee, device.DeviceId);
                var newRefreshToken = _tokenService.GenerateRefreshToken();

                device.RefreshToken = newRefreshToken;
                device.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
                device.LastUsed = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    token = newAccessToken,
                    refreshToken = newRefreshToken,
                    employeeId = device.EmployeeId,
                    employeeName = device.Employee.Name
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing token.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error refreshing token." });
            }
        }

        /// <summary>
        /// Logout endpoint to invalidate refresh token.
        /// </summary>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto request)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request.DeviceId) && request.EmployeeId > 0)
                {
                    var device = await _context.Devices
                        .FirstOrDefaultAsync(d => d.DeviceId == request.DeviceId && d.EmployeeId == request.EmployeeId);

                    if (device != null)
                    {
                        device.RefreshToken = null;
                        device.RefreshTokenExpiryTime = null;
                        await _context.SaveChangesAsync();
                    }
                }

                return Ok(new { success = true, message = "Logged out successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error during logout." });
            }
        }

        private static (double? Latitude, double? Longitude, string LocationName) ResolveLocation(
            double? inputLat,
            double? inputLng,
            string? inputLocName,
            Employee? employee)
        {
            if (inputLat.HasValue && inputLng.HasValue && inputLat.Value != 0 && inputLng.Value != 0)
            {
                var resolvedName = !string.IsNullOrWhiteSpace(inputLocName)
                    ? inputLocName
                    : (!string.IsNullOrWhiteSpace(employee?.AssignedArea) ? $"{employee.AssignedArea}, Maharashtra" : "Maharashtra, India");
                return (inputLat, inputLng, resolvedName);
            }

            if (employee?.LastLatitude.HasValue == true && employee?.LastLongitude.HasValue == true && employee.LastLatitude.Value != 0)
            {
                var resolvedName = !string.IsNullOrWhiteSpace(inputLocName)
                    ? inputLocName
                    : (!string.IsNullOrWhiteSpace(employee.AssignedArea) ? $"{employee.AssignedArea}, Maharashtra" : "Maharashtra, India");
                return (employee.LastLatitude, employee.LastLongitude, resolvedName);
            }

            var area = employee?.AssignedArea?.Trim().ToLowerInvariant() ?? "";
            var empName = employee?.Name?.Trim().ToLowerInvariant() ?? "";
            if (empName.Contains("pruthviraj") || area.Contains("nesari"))
                return (16.0682, 74.3315, !string.IsNullOrWhiteSpace(inputLocName) ? inputLocName : "Sarsenapati Prataprao Gujar Chowk, Nesari, Maharashtra");
            if (area.Contains("gadhinglaj"))
                return (16.2227, 74.3519, !string.IsNullOrWhiteSpace(inputLocName) ? inputLocName : "Gadhinglaj, Maharashtra");
            if (area.Contains("nesari"))
                return (16.0717, 74.3314, !string.IsNullOrWhiteSpace(inputLocName) ? inputLocName : "Nesari, Maharashtra");
            if (area.Contains("ajara") || area.Contains("ajra"))
                return (16.1171, 74.2058, !string.IsNullOrWhiteSpace(inputLocName) ? inputLocName : "Ajara, Maharashtra");
            if (area.Contains("chandgad"))
                return (15.9328, 74.3941, !string.IsNullOrWhiteSpace(inputLocName) ? inputLocName : "Chandgad, Maharashtra");
            if (area.Contains("kolhapur"))
                return (16.7050, 74.2433, !string.IsNullOrWhiteSpace(inputLocName) ? inputLocName : "Kolhapur, Maharashtra");
            if (area.Contains("nagpur"))
                return (21.1458, 79.0882, !string.IsNullOrWhiteSpace(inputLocName) ? inputLocName : "Nagpur, Maharashtra");
            if (area.Contains("ichalkaranji"))
                return (16.6957, 74.4636, !string.IsNullOrWhiteSpace(inputLocName) ? inputLocName : "Ichalkaranji, Maharashtra");

            return (16.7050, 74.2433, !string.IsNullOrWhiteSpace(inputLocName) ? inputLocName : (!string.IsNullOrWhiteSpace(employee?.AssignedArea) ? $"{employee.AssignedArea}, Maharashtra" : "Maharashtra, India"));
        }
    }
}
