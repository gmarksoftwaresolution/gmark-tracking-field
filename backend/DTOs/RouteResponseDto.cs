using System;
using System.Collections.Generic;

namespace NavbharatAgroAPI.DTOs
{
    public class RouteCoordinateDto
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class RouteCheckpointDto : RouteCoordinateDto
    {
        public string Type { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public double? EmployeeGpsLatitude { get; set; }
        public double? EmployeeGpsLongitude { get; set; }
        public DateTime? EmployeeGpsTimestamp { get; set; }
        public double? LocationDifferenceKm { get; set; }
        public string? LocationMatchStatus { get; set; }
    }

    public class RouteResponseDto
    {
        public int EmployeeId { get; set; }
        public RouteCoordinateDto? Origin { get; set; }
        public RouteCoordinateDto? Destination { get; set; }
        public List<RouteCheckpointDto> Checkpoints { get; set; } = new List<RouteCheckpointDto>();
        public string EncodedPolyline { get; set; } = string.Empty;
        public string? Message { get; set; }
        public double TotalDistanceKm { get; set; }
        public List<RouteCoordinateDto> GpsPings { get; set; } = new List<RouteCoordinateDto>();
    }
}
