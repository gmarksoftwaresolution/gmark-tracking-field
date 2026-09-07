using System;
using System.Collections.Generic;

namespace NavbharatAgroAPI.DTOs
{
    public class MonthlyTravelReportDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public double AllTimeKm { get; set; }
        public Dictionary<string, MonthlyTravelData> MonthlyData { get; set; } = new Dictionary<string, MonthlyTravelData>();
    }

    public class MonthlyTravelData
    {
        public double TotalKm { get; set; }
        public List<DailyTravelData> DailyData { get; set; } = new List<DailyTravelData>();
    }

    public class DailyTravelData
    {
        public string Date { get; set; } = string.Empty;
        public double Km { get; set; }
    }
}
