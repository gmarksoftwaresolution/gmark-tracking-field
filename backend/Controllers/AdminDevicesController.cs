using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using NavbharatAgroAPI.Models;
using NavbharatAgroAPI.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    [Route("api/admin/devices")]
    [ApiController]
    public class AdminDevicesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AdminDevicesController> _logger;
        private readonly IDeviceRevocationCache _revocationCache;

        public AdminDevicesController(
            AppDbContext context, 
            ILogger<AdminDevicesController> logger,
            IDeviceRevocationCache revocationCache)
        {
            _context = context;
            _logger = logger;
            _revocationCache = revocationCache;
        }

        /// <summary>
        /// Retrieves all pending device approval requests.
        /// </summary>
        [HttpGet("pending")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<DeviceResponseDto>))]
        public async Task<ActionResult<IEnumerable<DeviceResponseDto>>> GetPendingDevices()
        {
            try
            {
                var devices = await _context.Devices
                    .Include(d => d.Employee)
                    .Where(d => d.Status == DeviceStatus.Pending)
                    .OrderByDescending(d => d.RequestedAt)
                    .Select(d => new DeviceResponseDto
                    {
                        Id = d.Id,
                        EmployeeId = d.EmployeeId,
                        EmployeeName = d.Employee.Name,
                        EmployeeCode = d.Employee.EmployeeCode,
                        AssignedArea = d.Employee.AssignedArea,
                        DeviceId = d.DeviceId,
                        DeviceName = d.DeviceName,
                        Status = d.Status.ToString(),
                        Latitude = d.Latitude ?? d.Employee.LastLatitude,
                        Longitude = d.Longitude ?? d.Employee.LastLongitude,
                        LocationName = !string.IsNullOrEmpty(d.LocationName)
                            ? d.LocationName
                            : (!string.IsNullOrEmpty(d.Employee.AssignedArea) ? d.Employee.AssignedArea + ", Maharashtra" : "Maharashtra, India"),
                        Reason = d.Reason,
                        RequestedAt = d.RequestedAt,
                        ActionAt = d.ActionAt,
                        ActionBy = d.ActionBy,
                        LastUsed = d.LastUsed
                    })
                    .ToListAsync();

                return Ok(devices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching pending devices.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error fetching pending devices." });
            }
        }

        /// <summary>
        /// Retrieves device history (Approved, Revoked, Rejected).
        /// </summary>
        [HttpGet("history")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<DeviceResponseDto>))]
        public async Task<ActionResult<IEnumerable<DeviceResponseDto>>> GetDeviceHistory([FromQuery] string? status)
        {
            try
            {
                var query = _context.Devices
                    .Include(d => d.Employee)
                    .Where(d => d.Status != DeviceStatus.Pending);

                if (!string.IsNullOrEmpty(status) && Enum.TryParse<DeviceStatus>(status, true, out var filterStatus))
                {
                    query = query.Where(d => d.Status == filterStatus);
                }

                var devices = await query
                    .OrderByDescending(d => d.ActionAt ?? d.RequestedAt)
                    .Select(d => new DeviceResponseDto
                    {
                        Id = d.Id,
                        EmployeeId = d.EmployeeId,
                        EmployeeName = d.Employee.Name,
                        EmployeeCode = d.Employee.EmployeeCode,
                        AssignedArea = d.Employee.AssignedArea,
                        DeviceId = d.DeviceId,
                        DeviceName = d.DeviceName,
                        Status = d.Status.ToString(),
                        Latitude = d.Latitude ?? d.Employee.LastLatitude,
                        Longitude = d.Longitude ?? d.Employee.LastLongitude,
                        LocationName = !string.IsNullOrEmpty(d.LocationName)
                            ? d.LocationName
                            : (!string.IsNullOrEmpty(d.Employee.AssignedArea) ? d.Employee.AssignedArea + ", Maharashtra" : "Maharashtra, India"),
                        Reason = d.Reason,
                        RequestedAt = d.RequestedAt,
                        ActionAt = d.ActionAt,
                        ActionBy = d.ActionBy,
                        LastUsed = d.LastUsed
                    })
                    .ToListAsync();

                return Ok(devices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching device history.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error fetching device history." });
            }
        }

        /// <summary>
        /// Approves a pending device request, revokes previously approved devices for the employee, and clears revocation cache.
        /// </summary>
        [HttpPatch("{id}/approve")]
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveDevice(Guid id)
        {
            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var targetDevice = await _context.Devices
                    .Include(d => d.Employee)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (targetDevice == null)
                {
                    return NotFound(new { success = false, message = "Device request not found." });
                }

                var adminIdentity = User.Identity?.Name ?? "Admin";

                // 1. Find all previously approved devices for this employee
                var previousApprovedDevices = await _context.Devices
                    .Where(d => d.EmployeeId == targetDevice.EmployeeId && d.Id != targetDevice.Id && d.Status == DeviceStatus.Approved)
                    .ToListAsync();

                foreach (var prevDevice in previousApprovedDevices)
                {
                    prevDevice.Status = DeviceStatus.Revoked;
                    prevDevice.ActionBy = "Admin (Auto-unlinked)";
                    prevDevice.ActionAt = DateTime.UtcNow;
                    prevDevice.RefreshToken = null;
                    prevDevice.RefreshTokenExpiryTime = null;

                    // Instantly invalidate in in-memory revocation cache
                    _revocationCache.RevokeDevice(prevDevice.DeviceId);
                    _logger.LogInformation("Revoked and unlinked previous device {DeviceId} for Employee {EmpId}", prevDevice.DeviceId, prevDevice.EmployeeId);
                }

                // 2. Reject other pending requests for the same employee
                var otherPending = await _context.Devices
                    .Where(d => d.EmployeeId == targetDevice.EmployeeId && d.Id != targetDevice.Id && d.Status == DeviceStatus.Pending)
                    .ToListAsync();

                foreach (var pending in otherPending)
                {
                    pending.Status = DeviceStatus.Rejected;
                    pending.ActionBy = "System (Superseded)";
                    pending.ActionAt = DateTime.UtcNow;
                }

                // 3. Mark target device as APPROVED
                targetDevice.Status = DeviceStatus.Approved;
                targetDevice.ActionAt = DateTime.UtcNow;
                targetDevice.ActionBy = adminIdentity;
                targetDevice.LastUsed = DateTime.UtcNow;

                // 4. Update Employee model state
                targetDevice.Employee.DeviceId = targetDevice.DeviceId;
                targetDevice.Employee.DeviceChangeStatus = "Approved";
                targetDevice.Employee.PendingDeviceId = null;

                // 5. Clear from revocation cache if it was ever cached
                _revocationCache.ClearRevokedDevice(targetDevice.DeviceId);

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                _logger.LogInformation("Successfully approved device {DeviceId} for Employee {EmpName}", targetDevice.DeviceId, targetDevice.Employee.Name);

                return Ok(new
                {
                    success = true,
                    message = $"Device '{targetDevice.DeviceName ?? targetDevice.DeviceId}' approved. Any previously active device for {targetDevice.Employee.Name} was unlinked."
                });
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                _logger.LogError(ex, "Error approving device {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, message = "Error approving device.", error = ex.Message });
            }
        }

        /// <summary>
        /// Rejects a pending device approval request.
        /// </summary>
        [HttpPatch("{id}/reject")]
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectDevice(Guid id)
        {
            try
            {
                var targetDevice = await _context.Devices
                    .Include(d => d.Employee)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (targetDevice == null)
                {
                    return NotFound(new { success = false, message = "Device request not found." });
                }

                var adminIdentity = User.Identity?.Name ?? "Admin";

                targetDevice.Status = DeviceStatus.Rejected;
                targetDevice.ActionAt = DateTime.UtcNow;
                targetDevice.ActionBy = adminIdentity;
                targetDevice.RefreshToken = null;
                targetDevice.RefreshTokenExpiryTime = null;

                if (targetDevice.Employee.PendingDeviceId == targetDevice.DeviceId)
                {
                    targetDevice.Employee.PendingDeviceId = null;
                    targetDevice.Employee.DeviceChangeStatus = "Rejected";
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Rejected device {DeviceId} for Employee {EmpName}", targetDevice.DeviceId, targetDevice.Employee.Name);

                return Ok(new
                {
                    success = true,
                    message = $"Device request for {targetDevice.Employee.Name} was rejected."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting device {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, message = "Error rejecting device." });
            }
        }
    }
}

