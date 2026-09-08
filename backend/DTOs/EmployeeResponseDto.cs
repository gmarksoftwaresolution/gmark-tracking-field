using System;

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
        public int? RoleId { get; set; }
        public string? RoleName { get; set; }
        public int? BranchId { get; set; }
        public string? BranchName { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public int? DesignationId { get; set; }
        public string? DesignationName { get; set; }
        public int? ShiftId { get; set; }
        public string? ShiftName { get; set; }
        public DateTime? JoiningDate { get; set; }
        public string? EmploymentStatus { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class StartTripRequestDto
    {
        public string? RouteCode { get; set; }
    }
}
