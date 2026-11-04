using System;

namespace NavbharatAgroAPI.DTOs
{
    public class DeviceLoginRequestDto
    {
        public string? Identifier { get; set; } // Employee Code, Mobile or Name
        public int EmployeeId { get; set; }
        public string Password { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public string? DeviceName { get; set; }
        public string? PushToken { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? LocationName { get; set; }
        public string? Reason { get; set; }
    }

    public class DeviceStatusRequestDto
    {
        public string? Identifier { get; set; }
        public int EmployeeId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
    }

    public class SubmitDeviceReasonDto
    {
        public string? Identifier { get; set; }
        public int EmployeeId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? LocationName { get; set; }
    }

    public class RefreshTokenRequestDto
    {
        public int EmployeeId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class DeviceResponseDto
    {
        public Guid Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeCode { get; set; } = string.Empty;
        public string? AssignedArea { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string? DeviceName { get; set; }
        public string Status { get; set; } = "Pending";
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? LocationName { get; set; }
        public string? Reason { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ActionAt { get; set; }
        public string? ActionBy { get; set; }
        public DateTime LastUsed { get; set; }
    }
}
