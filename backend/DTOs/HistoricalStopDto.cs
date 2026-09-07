using System;
using System.Collections.Generic;

namespace NavbharatAgroAPI.DTOs
{
    public class HistoricalStopDto
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int DurationMinutes { get; set; }
    }
}
