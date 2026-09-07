using System;
using System.Collections.Generic;

namespace NavbharatAgroAPI.DTOs
{
    public class EmployeeResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string EmployeeCode { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string? AssignedArea { get; set; }
        public string? TripStatus { get; set; } = "Not Started";
        public DateTime? TripStartTime { get; set; }
        public DateTime? TripEndTime { get; set; }
        public string? SelectedRouteCode { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Message { get; set; } = string.Empty;

        // Location Tracking Fields
        public double? LastLatitude { get; set; }
        public double? LastLongitude { get; set; }
        public DateTime? LastLocationTimestamp { get; set; }
        public string? LastKnownAddress { get; set; }
        public double TodayTravelledDistance { get; set; }
        public int StoppedDurationMinutes { get; set; }
        public DateTime? LastMovementTimestamp { get; set; }
        public List<HistoricalStopDto> HistoricalStops { get; set; } = new List<HistoricalStopDto>();
    }

    public class StartTripRequestDto
    {
        public string? RouteCode { get; set; }
    }
}
