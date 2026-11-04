namespace NavbharatAgroAPI.DTOs
{
    public class LoginResponseDto
    {
        public bool Success { get; set; } = true;
        public bool IsDeviceApproved { get; set; } = true;
        public string Status { get; set; } = "APPROVED";
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string? RefreshToken { get; set; }
        public string? DeviceId { get; set; }
        public string? Reason { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsDeviceChangePending { get; set; } = false;
        public object? Session { get; set; }
    }
}
