using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.Models;
using NavbharatAgroAPI.Services;
using System.Text.Json;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Middleware
{
    public class DeviceRevocationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<DeviceRevocationMiddleware> _logger;

        public DeviceRevocationMiddleware(RequestDelegate next, ILogger<DeviceRevocationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IDeviceRevocationCache revocationCache)
        {
            // Skip device revocation check for authentication endpoints, Swagger, and health
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
            if (path.StartsWith("/api/auth") || path.StartsWith("/swagger") || path.StartsWith("/hubs") || path == "/health" || path == "/")
            {
                await _next(context);
                return;
            }

            // ADMIN IMMUNITY: Device binding and revocation is EXCLUSIVELY for Employees, NEVER for Admin!
            // Admin gives approvals and monitors from any computer/browser without being locked or logged out.
            var userRoleHeader = context.Request.Headers["X-User-Role"].ToString();
            bool isAdmin = path.StartsWith("/api/admin") || 
                           string.Equals(userRoleHeader, "Admin", StringComparison.OrdinalIgnoreCase) ||
                           context.User.IsInRole("Admin") ||
                           context.User.HasClaim(c => c.Type == "role" && c.Value.Equals("Admin", StringComparison.OrdinalIgnoreCase));

            if (isAdmin)
            {
                await _next(context);
                return;
            }

            // Extract deviceId from header or User claims
            string? deviceId = null;
            if (context.Request.Headers.TryGetValue("X-Device-Id", out var headerVal))
            {
                deviceId = headerVal.ToString().Trim();
            }

            if (string.IsNullOrEmpty(deviceId) && context.User.Identity?.IsAuthenticated == true)
            {
                deviceId = context.User.FindFirst("deviceId")?.Value;
            }

            if (!string.IsNullOrEmpty(deviceId))
            {
                // Check in-memory cache first
                bool isRevoked = revocationCache.IsDeviceRevoked(deviceId);

                if (!isRevoked)
                {
                    // If not in revocation cache, optionally check if any active employee claims are tied to a revoked device in DB
                    // (Done efficiently without heavy DB queries, or cache keeps active revoked list)
                }
                else
                {
                    _logger.LogWarning("Blocked request from revoked device ID: {DeviceId}", deviceId);

                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";

                    var response = new
                    {
                        success = false,
                        isDeviceRevoked = true,
                        message = "This device has been unlinked because a new device was approved. Please log in again."
                    };

                    await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                    return;
                }
            }

            await _next(context);
        }
    }
}

