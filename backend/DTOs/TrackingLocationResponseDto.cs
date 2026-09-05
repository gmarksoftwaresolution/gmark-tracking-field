using System;

namespace NavbharatAgroAPI.DTOs
{
    public class TrackingLocationResponseDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime Timestamp { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
