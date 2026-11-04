namespace NavbharatAgroAPI.DTOs
{
    public class LoginRequestDto
    {
        public string? Identifier { get; set; }
        public int EmployeeId { get; set; }
        public string Password { get; set; } = string.Empty;
        public string? DeviceId { get; set; }
        public string? DeviceName { get; set; }
        public string? PushToken { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? LocationName { get; set; }
        public string? Reason { get; set; }
    }
}
