namespace NavbharatAgroAPI.DTOs
{
    public class LoginRequestDto
    {
        public int EmployeeId { get; set; }
        public string Password { get; set; } = string.Empty;
        public string? DeviceId { get; set; }
    }
}
