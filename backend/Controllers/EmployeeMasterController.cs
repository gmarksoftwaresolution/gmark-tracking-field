using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using NavbharatAgroAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    /// <summary>
    /// Manages HR Employee Master records in the system.
    /// </summary>
    [Route("api/employeemaster")]
    [ApiController]
    public class EmployeeMasterController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<EmployeeMasterController> _logger;

        public EmployeeMasterController(AppDbContext context, ILogger<EmployeeMasterController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves HR Employee Master records with optional filters.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmployeeMasterResponseDto>>> GetEmployeeMasters(
            [FromQuery] string? search,
            [FromQuery] string? department,
            [FromQuery] string? status,
            [FromQuery] string? employmentType)
        {
            try
            {
                var query = _context.EmployeeMasters
                    .Include(em => em.Department)
                    .Include(em => em.Designation)
                    .Include(em => em.RoleMaster)
                    .Include(em => em.Branch)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.Trim().ToLower();
                    query = query.Where(e =>
                        e.FullName.ToLower().Contains(s) ||
                        e.EmployeeCode.ToLower().Contains(s) ||
                        (e.EmployeeId != null && e.EmployeeId.ToLower().Contains(s)) ||
                        e.MobileNumber.Contains(s) ||
                        (e.EmailAddress != null && e.EmailAddress.ToLower().Contains(s)) ||
                        (e.DepartmentName != null && e.DepartmentName.ToLower().Contains(s)));
                }

                if (!string.IsNullOrWhiteSpace(department) && department != "All")
                {
                    var dep = department.Trim().ToLower();
                    query = query.Where(e => (e.DepartmentName != null && e.DepartmentName.ToLower() == dep) ||
                                             (e.Department != null && e.Department.Name.ToLower() == dep));
                }

                if (!string.IsNullOrWhiteSpace(status) && status != "All")
                {
                    var st = status.Trim().ToLower();
                    query = query.Where(e => e.EmployeeStatus.ToLower() == st);
                }

                if (!string.IsNullOrWhiteSpace(employmentType) && employmentType != "All")
                {
                    var et = employmentType.Trim().ToLower();
                    query = query.Where(e => e.EmploymentType != null && e.EmploymentType.ToLower() == et);
                }

                var list = await query.OrderBy(e => e.Id).ToListAsync();

                return Ok(list.Select(MapToResponseDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee master list.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred fetching employee master records." });
            }
        }

        /// <summary>
        /// Generates the next sequential Employee Code (e.g., EMP0001, EMP0002).
        /// </summary>
        [HttpGet("next-code")]
        public async Task<ActionResult<object>> GetNextEmployeeCode()
        {
            try
            {
                var nextCode = await GenerateNextEmployeeCodeInternal();
                return Ok(new { nextEmployeeCode = nextCode });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating next employee code.");
                return Ok(new { nextEmployeeCode = "EMP0001" });
            }
        }

        /// <summary>
        /// Retrieves a specific Employee Master record by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeMasterResponseDto>> GetEmployeeMaster(int id)
        {
            try
            {
                var emp = await _context.EmployeeMasters
                    .Include(e => e.Department)
                    .Include(e => e.Designation)
                    .Include(e => e.RoleMaster)
                    .Include(e => e.Branch)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (emp == null)
                {
                    return NotFound(new { message = $"Employee Master record with Id {id} not found." });
                }

                return Ok(MapToResponseDto(emp));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting employee master record for Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error retrieving record.");
            }
        }

        /// <summary>
        /// Creates a new Employee Master record.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<EmployeeMasterResponseDto>> CreateEmployeeMaster(EmployeeMasterRequestDto dto)
        {
            try
            {
                // Auto-generate code if not provided
                if (string.IsNullOrWhiteSpace(dto.EmployeeCode))
                {
                    dto.EmployeeCode = await GenerateNextEmployeeCodeInternal();
                }
                else
                {
                    dto.EmployeeCode = dto.EmployeeCode.Trim().ToUpper();
                }

                // Check duplicate EmployeeCode
                if (await _context.EmployeeMasters.AnyAsync(e => e.EmployeeCode == dto.EmployeeCode))
                {
                    return Conflict(new { message = $"Employee Code '{dto.EmployeeCode}' already exists." });
                }

                // Check duplicate EmployeeId if provided
                if (!string.IsNullOrWhiteSpace(dto.EmployeeId))
                {
                    dto.EmployeeId = dto.EmployeeId.Trim();
                    if (await _context.EmployeeMasters.AnyAsync(e => e.EmployeeId == dto.EmployeeId))
                    {
                        return Conflict(new { message = $"Employee ID '{dto.EmployeeId}' already exists." });
                    }
                }
                else
                {
                    dto.EmployeeId = $"EMP-{DateTime.UtcNow.Year}-{dto.EmployeeCode.Replace("EMP", "")}";
                }

                // Check duplicate Email if provided
                if (!string.IsNullOrWhiteSpace(dto.EmailAddress))
                {
                    dto.EmailAddress = dto.EmailAddress.Trim().ToLower();
                    if (await _context.EmployeeMasters.AnyAsync(e => e.EmailAddress == dto.EmailAddress))
                    {
                        return Conflict(new { message = $"Email Address '{dto.EmailAddress}' already exists." });
                    }
                }

                // Validate mobile number format (10 digits)
                if (string.IsNullOrWhiteSpace(dto.MobileNumber) || !Regex.IsMatch(dto.MobileNumber.Trim(), @"^\d{10}$"))
                {
                    return BadRequest(new { message = "Mobile Number must be exactly 10 digits." });
                }

                // Department Name lookup fallback
                string? departmentName = dto.DepartmentName;
                if (dto.DepartmentId.HasValue && dto.DepartmentId.Value > 0)
                {
                    var dep = await _context.Departments.FindAsync(dto.DepartmentId.Value);
                    if (dep != null) departmentName = dep.Name;
                }

                // Designation Name lookup fallback
                string? designationName = dto.DesignationName;
                if (dto.DesignationId.HasValue && dto.DesignationId.Value > 0)
                {
                    var des = await _context.Designations.FindAsync(dto.DesignationId.Value);
                    if (des != null) designationName = des.Name;
                }

                // Role Name lookup fallback
                string? roleName = dto.RoleName;
                if (dto.RoleId.HasValue && dto.RoleId.Value > 0)
                {
                    var r = await _context.RoleMasters.FindAsync(dto.RoleId.Value);
                    if (r != null) roleName = r.Name;
                }

                // Branch Name lookup fallback
                string? branchName = dto.BranchName;
                if (dto.BranchId.HasValue && dto.BranchId.Value > 0)
                {
                    var b = await _context.Branches.FindAsync(dto.BranchId.Value);
                    if (b != null) branchName = b.Name;
                }

                // Construct Full Name
                var fullNameParts = new List<string> { dto.FirstName.Trim() };
                if (!string.IsNullOrWhiteSpace(dto.MiddleName)) fullNameParts.Add(dto.MiddleName.Trim());
                fullNameParts.Add(dto.LastName.Trim());
                var fullName = string.Join(" ", fullNameParts);

                // Hash password securely with BCrypt
                string? hashedPassword = null;
                if (!string.IsNullOrWhiteSpace(dto.Password))
                {
                    hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password.Trim());
                }
                else
                {
                    hashedPassword = BCrypt.Net.BCrypt.HashPassword("123456"); // Default initial password
                }

                var emp = new EmployeeMaster
                {
                    EmployeeCode = dto.EmployeeCode,
                    EmployeeId = dto.EmployeeId,
                    FirstName = dto.FirstName.Trim(),
                    MiddleName = dto.MiddleName?.Trim(),
                    LastName = dto.LastName.Trim(),
                    FullName = fullName,
                    Gender = dto.Gender,
                    DateOfBirth = dto.DateOfBirth,
                    MobileNumber = dto.MobileNumber.Trim(),
                    EmailAddress = dto.EmailAddress,
                    PasswordHash = hashedPassword,
                    ProfilePhoto = dto.ProfilePhoto,
                    DepartmentId = dto.DepartmentId > 0 ? dto.DepartmentId : null,
                    DepartmentName = departmentName,
                    DesignationId = dto.DesignationId > 0 ? dto.DesignationId : null,
                    DesignationName = designationName,
                    RoleId = dto.RoleId > 0 ? dto.RoleId : null,
                    RoleName = roleName,
                    BranchId = dto.BranchId > 0 ? dto.BranchId : null,
                    BranchName = branchName,
                    ReportingManager = dto.ReportingManager,
                    DateOfJoining = dto.DateOfJoining,
                    EmploymentType = dto.EmploymentType ?? "Permanent",
                    EmployeeStatus = dto.EmployeeStatus ?? "Active",
                    CurrentAddress = dto.CurrentAddress,
                    PermanentAddress = dto.PermanentAddress,
                    City = dto.City,
                    State = dto.State,
                    Pincode = dto.Pincode,
                    AadhaarNumber = dto.AadhaarNumber,
                    PanNumber = dto.PanNumber,
                    DrivingLicenceNumber = dto.DrivingLicenceNumber,
                    EmergencyContactName = dto.EmergencyContactName,
                    Relationship = dto.Relationship,
                    EmergencyContactNumber = dto.EmergencyContactNumber,
                    CreatedAt = DateTime.UtcNow
                };

                _context.EmployeeMasters.Add(emp);
                await _context.SaveChangesAsync();

                // AUTOMATIC SYNCHRONIZATION: If Department == Sales, create/sync operational SalesEmployee record
                bool isSalesDepartment = (emp.DepartmentId == 1) ||
                                         (!string.IsNullOrWhiteSpace(emp.DepartmentName) && emp.DepartmentName.ToLower().Contains("sales"));

                if (isSalesDepartment)
                {
                    var existingSales = await _context.SalesEmployees
                        .FirstOrDefaultAsync(s => s.EmployeeMasterId == emp.Id || s.EmployeeCode.ToLower() == emp.EmployeeCode.ToLower());

                    if (existingSales == null)
                    {
                        int nextSalesId = await _context.SalesEmployees.AnyAsync()
                            ? await _context.SalesEmployees.MaxAsync(s => s.Id) + 1
                            : 1;

                        var salesEmp = new SalesEmployee
                        {
                            Id = nextSalesId,
                            Name = emp.FullName,
                            EmployeeCode = emp.EmployeeCode,
                            MobileNumber = emp.MobileNumber,
                            AssignedArea = emp.BranchName ?? "Head Office",
                            PasswordHash = emp.PasswordHash,
                            IsActive = emp.EmployeeStatus == "Active",
                            TripStatus = "Not Started",
                            CreatedAt = DateTime.UtcNow,
                            EmployeeMasterId = emp.Id
                        };

                        _context.SalesEmployees.Add(salesEmp);
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        existingSales.EmployeeMasterId = emp.Id;
                        existingSales.Name = emp.FullName;
                        existingSales.MobileNumber = emp.MobileNumber;
                        existingSales.PasswordHash = emp.PasswordHash;
                        existingSales.IsActive = emp.EmployeeStatus == "Active";
                        await _context.SaveChangesAsync();
                    }
                }

                _logger.LogInformation("Employee Master record created successfully with ID {Id}.", emp.Id);

                var responseDto = MapToResponseDto(emp);
                responseDto.Message = "Employee Master Created Successfully";
                return CreatedAtAction(nameof(GetEmployeeMaster), new { id = emp.Id }, responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Employee Master record.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to create Employee Master record.", details = ex.Message });
            }
        }

        /// <summary>
        /// Updates an existing Employee Master record.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<EmployeeMasterResponseDto>> UpdateEmployeeMaster(int id, EmployeeMasterRequestDto dto)
        {
            try
            {
                var emp = await _context.EmployeeMasters.FindAsync(id);
                if (emp == null)
                {
                    return NotFound(new { message = $"Employee Master record with Id {id} not found." });
                }

                // Duplicate check for EmployeeCode if changed
                if (!string.IsNullOrWhiteSpace(dto.EmployeeCode) && dto.EmployeeCode.Trim().ToUpper() != emp.EmployeeCode)
                {
                    var newCode = dto.EmployeeCode.Trim().ToUpper();
                    if (await _context.EmployeeMasters.AnyAsync(e => e.Id != id && e.EmployeeCode == newCode))
                    {
                        return Conflict(new { message = $"Employee Code '{newCode}' already exists." });
                    }
                    emp.EmployeeCode = newCode;
                }

                // Duplicate check for Email if changed
                if (!string.IsNullOrWhiteSpace(dto.EmailAddress))
                {
                    var newEmail = dto.EmailAddress.Trim().ToLower();
                    if (await _context.EmployeeMasters.AnyAsync(e => e.Id != id && e.EmailAddress == newEmail))
                    {
                        return Conflict(new { message = $"Email Address '{newEmail}' already exists." });
                    }
                    emp.EmailAddress = newEmail;
                }

                // Construct Full Name
                var fullNameParts = new List<string> { dto.FirstName.Trim() };
                if (!string.IsNullOrWhiteSpace(dto.MiddleName)) fullNameParts.Add(dto.MiddleName.Trim());
                fullNameParts.Add(dto.LastName.Trim());
                emp.FullName = string.Join(" ", fullNameParts);

                emp.FirstName = dto.FirstName.Trim();
                emp.MiddleName = dto.MiddleName?.Trim();
                emp.LastName = dto.LastName.Trim();
                emp.Gender = dto.Gender;
                emp.DateOfBirth = dto.DateOfBirth;
                emp.MobileNumber = dto.MobileNumber.Trim();
                emp.ProfilePhoto = dto.ProfilePhoto ?? emp.ProfilePhoto;

                // Department Name lookup fallback
                if (dto.DepartmentId.HasValue && dto.DepartmentId.Value > 0)
                {
                    emp.DepartmentId = dto.DepartmentId;
                    var dep = await _context.Departments.FindAsync(dto.DepartmentId.Value);
                    if (dep != null) emp.DepartmentName = dep.Name;
                }

                // Designation Name lookup fallback
                if (dto.DesignationId.HasValue && dto.DesignationId.Value > 0)
                {
                    emp.DesignationId = dto.DesignationId;
                    var des = await _context.Designations.FindAsync(dto.DesignationId.Value);
                    if (des != null) emp.DesignationName = des.Name;
                }

                // Role Name lookup fallback
                if (dto.RoleId.HasValue && dto.RoleId.Value > 0)
                {
                    emp.RoleId = dto.RoleId;
                    var r = await _context.RoleMasters.FindAsync(dto.RoleId.Value);
                    if (r != null) emp.RoleName = r.Name;
                }

                // Branch Name lookup fallback
                if (dto.BranchId.HasValue && dto.BranchId.Value > 0)
                {
                    emp.BranchId = dto.BranchId;
                    var b = await _context.Branches.FindAsync(dto.BranchId.Value);
                    if (b != null) emp.BranchName = b.Name;
                }

                emp.ReportingManager = dto.ReportingManager;
                emp.DateOfJoining = dto.DateOfJoining;
                emp.EmploymentType = dto.EmploymentType ?? emp.EmploymentType;
                emp.EmployeeStatus = dto.EmployeeStatus ?? emp.EmployeeStatus;

                emp.CurrentAddress = dto.CurrentAddress;
                emp.PermanentAddress = dto.PermanentAddress;
                emp.City = dto.City;
                emp.State = dto.State;
                emp.Pincode = dto.Pincode;

                emp.AadhaarNumber = dto.AadhaarNumber;
                emp.PanNumber = dto.PanNumber;
                emp.DrivingLicenceNumber = dto.DrivingLicenceNumber;

                emp.EmergencyContactName = dto.EmergencyContactName;
                emp.Relationship = dto.Relationship;
                emp.EmergencyContactNumber = dto.EmergencyContactNumber;

                emp.UpdatedAt = DateTime.UtcNow;

                if (!string.IsNullOrWhiteSpace(dto.Password))
                {
                    emp.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password.Trim());
                }

                _context.Entry(emp).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                // AUTOMATIC SYNCHRONIZATION: Sync changes to SalesEmployees if linked or if Department is Sales
                bool isSalesDept = (emp.DepartmentId == 1) ||
                                   (!string.IsNullOrWhiteSpace(emp.DepartmentName) && emp.DepartmentName.ToLower().Contains("sales"));

                var linkedSales = await _context.SalesEmployees
                    .FirstOrDefaultAsync(s => s.EmployeeMasterId == emp.Id || s.EmployeeCode.ToLower() == emp.EmployeeCode.ToLower());

                if (isSalesDept)
                {
                    if (linkedSales == null)
                    {
                        int nextSalesId = await _context.SalesEmployees.AnyAsync()
                            ? await _context.SalesEmployees.MaxAsync(s => s.Id) + 1
                            : 1;

                        var salesEmp = new SalesEmployee
                        {
                            Id = nextSalesId,
                            Name = emp.FullName,
                            EmployeeCode = emp.EmployeeCode,
                            MobileNumber = emp.MobileNumber,
                            AssignedArea = emp.BranchName ?? "Head Office",
                            PasswordHash = emp.PasswordHash,
                            IsActive = emp.EmployeeStatus == "Active",
                            TripStatus = "Not Started",
                            CreatedAt = DateTime.UtcNow,
                            EmployeeMasterId = emp.Id
                        };

                        _context.SalesEmployees.Add(salesEmp);
                    }
                    else
                    {
                        linkedSales.EmployeeMasterId = emp.Id;
                        linkedSales.Name = emp.FullName;
                        linkedSales.MobileNumber = emp.MobileNumber;
                        linkedSales.PasswordHash = emp.PasswordHash;
                        linkedSales.IsActive = emp.EmployeeStatus == "Active";
                    }
                    await _context.SaveChangesAsync();
                }
                else if (linkedSales != null)
                {
                    linkedSales.Name = emp.FullName;
                    linkedSales.MobileNumber = emp.MobileNumber;
                    linkedSales.PasswordHash = emp.PasswordHash;
                    linkedSales.IsActive = emp.EmployeeStatus == "Active";
                    await _context.SaveChangesAsync();
                }

                var responseDto = MapToResponseDto(emp);
                responseDto.Message = "Employee Master Updated Successfully";
                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating Employee Master record Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to update Employee Master record." });
            }
        }

        /// <summary>
        /// Toggles or sets Employee Status (Active / Inactive).
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<ActionResult<EmployeeMasterResponseDto>> UpdateStatus(int id, [FromBody] StatusUpdateRequestDto request)
        {
            try
            {
                var emp = await _context.EmployeeMasters.FindAsync(id);
                if (emp == null)
                {
                    return NotFound(new { message = $"Employee Master record with Id {id} not found." });
                }

                emp.EmployeeStatus = request.EmployeeStatus ?? (emp.EmployeeStatus == "Active" ? "Inactive" : "Active");
                emp.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var linkedSales = await _context.SalesEmployees
                    .FirstOrDefaultAsync(s => s.EmployeeMasterId == emp.Id || s.EmployeeCode.ToLower() == emp.EmployeeCode.ToLower());
                if (linkedSales != null)
                {
                    linkedSales.IsActive = emp.EmployeeStatus == "Active";
                    await _context.SaveChangesAsync();
                }

                var responseDto = MapToResponseDto(emp);
                responseDto.Message = $"Status updated to {emp.EmployeeStatus}";
                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating status for Employee Master Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Failed to update status.");
            }
        }

        /// <summary>
        /// Deletes an Employee Master record.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployeeMaster(int id)
        {
            try
            {
                var emp = await _context.EmployeeMasters.FindAsync(id);
                if (emp == null)
                {
                    return NotFound(new { message = $"Employee Master record with Id {id} not found." });
                }

                _context.EmployeeMasters.Remove(emp);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting Employee Master record Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Failed to delete record.");
            }
        }

        private async Task<string> GenerateNextEmployeeCodeInternal()
        {
            var maxId = await _context.EmployeeMasters.CountAsync();
            var nextNum = maxId + 1;
            var code = $"EMP{nextNum:D4}";

            while (await _context.EmployeeMasters.AnyAsync(e => e.EmployeeCode == code))
            {
                nextNum++;
                code = $"EMP{nextNum:D4}";
            }

            return code;
        }

        private EmployeeMasterResponseDto MapToResponseDto(EmployeeMaster emp)
        {
            return new EmployeeMasterResponseDto
            {
                Id = emp.Id,
                EmployeeCode = emp.EmployeeCode,
                EmployeeId = emp.EmployeeId ?? $"EMP-2026-{emp.EmployeeCode.Replace("EMP", "")}",
                FirstName = emp.FirstName,
                MiddleName = emp.MiddleName,
                LastName = emp.LastName,
                FullName = emp.FullName,
                Gender = emp.Gender,
                DateOfBirth = emp.DateOfBirth,
                MobileNumber = emp.MobileNumber,
                EmailAddress = emp.EmailAddress,
                ProfilePhoto = emp.ProfilePhoto,
                DepartmentId = emp.DepartmentId,
                DepartmentName = emp.DepartmentName ?? emp.Department?.Name,
                DesignationId = emp.DesignationId,
                DesignationName = emp.DesignationName ?? emp.Designation?.Name,
                RoleId = emp.RoleId,
                RoleName = emp.RoleName ?? emp.RoleMaster?.Name,
                BranchId = emp.BranchId,
                BranchName = emp.BranchName ?? emp.Branch?.Name,
                ReportingManager = emp.ReportingManager,
                DateOfJoining = emp.DateOfJoining,
                EmploymentType = emp.EmploymentType,
                EmployeeStatus = emp.EmployeeStatus,
                CurrentAddress = emp.CurrentAddress,
                PermanentAddress = emp.PermanentAddress,
                City = emp.City,
                State = emp.State,
                Pincode = emp.Pincode,
                AadhaarNumber = emp.AadhaarNumber,
                PanNumber = emp.PanNumber,
                DrivingLicenceNumber = emp.DrivingLicenceNumber,
                EmergencyContactName = emp.EmergencyContactName,
                Relationship = emp.Relationship,
                EmergencyContactNumber = emp.EmergencyContactNumber,
                CreatedAt = emp.CreatedAt,
                UpdatedAt = emp.UpdatedAt
            };
        }
    }

    public class StatusUpdateRequestDto
    {
        public string? EmployeeStatus { get; set; }
    }
}
