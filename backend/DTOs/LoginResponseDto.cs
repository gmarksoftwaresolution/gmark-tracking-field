namespace NavbharatAgroAPI.DTOs
{
    public class LoginResponseDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsDeviceChangePending { get; set; } = false;
    }
}
