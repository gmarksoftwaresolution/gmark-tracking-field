using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.Models;
using NavbharatAgroAPI.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    /// <summary>
    /// Manages Field Visit records, including GPS location tracking.
    /// </summary>
    [Route("api/fieldvisits")]
    [ApiController]
    public class FieldVisitController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<FieldVisitController> _logger;

        public FieldVisitController(AppDbContext context, ILogger<FieldVisitController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves a list of all field visits.
        /// </summary>
        /// <returns>A list of FieldVisitResponseDto.</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<FieldVisitResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<FieldVisitResponseDto>>> GetFieldVisits()
        {
            try
            {
                var visits = await _context.FieldVisits.Include(v => v.Product).ToListAsync();
                return Ok(visits.Select(v => MapToResponseDto(v, "Retrieved Successfully")));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting all field visits.");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Retrieves a specific field visit by its ID.
        /// </summary>
        /// <param name="id">The unique identifier of the field visit.</param>
        /// <returns>The FieldVisitResponseDto.</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FieldVisitResponseDto))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<FieldVisitResponseDto>> GetFieldVisit(int id)
        {
            try
            {
                var visit = await _context.FieldVisits.Include(v => v.Product).FirstOrDefaultAsync(v => v.Id == id);

                if (visit == null)
                {
                    _logger.LogWarning("GetFieldVisit: FieldVisit with Id {Id} not found.", id);
                    return NotFound(new { message = $"FieldVisit with Id {id} not found." });
                }

                return Ok(MapToResponseDto(visit, "Retrieved Successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting FieldVisit with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Creates a new field visit record.
        /// </summary>
        /// <param name="requestDto">The field visit details including optional GPS coordinates.</param>
        /// <returns>The created FieldVisitResponseDto.</returns>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(FieldVisitResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<FieldVisitResponseDto>> PostFieldVisit(FieldVisitRequestDto requestDto)
        {
            try
            {
                // Validate EmployeeId
                if (requestDto.EmployeeId.HasValue)
                {
                    bool employeeExists = await _context.SalesEmployees.AnyAsync(e => e.Id == requestDto.EmployeeId);
                    if (!employeeExists)
                    {
                        _logger.LogWarning("PostFieldVisit: Employee with Id {Id} does not exist.", requestDto.EmployeeId);
                        return BadRequest(new { message = $"Employee with Id {requestDto.EmployeeId} does not exist." });
                    }
                }

                if (!TimeOnly.TryParse(requestDto.VisitTime, out TimeOnly parsedTime))
                {
                    _logger.LogWarning("PostFieldVisit: Failed to parse VisitTime '{Time}'. Using current time.", requestDto.VisitTime);
                    parsedTime = TimeOnly.FromDateTime(DateTime.UtcNow);
                }

                var visit = new FieldVisit
                {
                    EmployeeId = requestDto.EmployeeId,
                    AssignedBy = requestDto.AssignedBy,
                    Route = string.IsNullOrWhiteSpace(requestDto.Route) ? "General Route" : requestDto.Route,
                    CustomerName = requestDto.CustomerName,
                    Village = requestDto.Village,
                    MobileNumber = requestDto.MobileNumber,
                    CustomerCategory = requestDto.CustomerCategory,
                    ProductId = requestDto.ProductId,
                    ProductNames = requestDto.ProductNames,
                    ShortNote = requestDto.ShortNote,
                    Latitude = requestDto.Latitude,
                    Longitude = requestDto.Longitude,
                    VisitDate = DateOnly.FromDateTime(requestDto.VisitDate),
                    VisitTime = parsedTime
                };

                _context.FieldVisits.Add(visit);
                await _context.SaveChangesAsync();

                _logger.LogInformation("FieldVisit with Id {Id} created successfully.", visit.Id);

                var responseDto = MapToResponseDto(visit, "Field Visit Saved Successfully");
                return CreatedAtAction(nameof(GetFieldVisit), new { id = visit.Id }, responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating a new FieldVisit.");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Updates an existing field visit.
        /// </summary>
        /// <param name="id">The unique identifier of the field visit.</param>
        /// <param name="requestDto">The updated field visit details.</param>
        /// <returns>A success message.</returns>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FieldVisitResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<FieldVisitResponseDto>> PutFieldVisit(int id, FieldVisitRequestDto requestDto)
        {
            if (id != requestDto.Id)
            {
                _logger.LogWarning("PutFieldVisit: Route Id ({RouteId}) and Request Body Id ({BodyId}) do not match.", id, requestDto.Id);
                return BadRequest(new { message = "Route Id and Request Body Id do not match." });
            }

            try
            {
                // Validate EmployeeId
                if (requestDto.EmployeeId.HasValue)
                {
                    bool employeeExists = await _context.SalesEmployees.AnyAsync(e => e.Id == requestDto.EmployeeId);
                    if (!employeeExists)
                    {
                        _logger.LogWarning("PutFieldVisit: Employee with Id {Id} does not exist.", requestDto.EmployeeId);
                        return BadRequest(new { message = $"Employee with Id {requestDto.EmployeeId} does not exist." });
                    }
                }

                var visit = await _context.FieldVisits.FindAsync(id);
                if (visit == null)
                {
                    _logger.LogWarning("PutFieldVisit: FieldVisit with Id {Id} not found.", id);
                    return NotFound(new { message = $"FieldVisit with Id {id} not found." });
                }

                if (!TimeOnly.TryParse(requestDto.VisitTime, out TimeOnly parsedTime))
                {
                    _logger.LogWarning("PutFieldVisit: Failed to parse VisitTime '{Time}'. Using current time.", requestDto.VisitTime);
                    parsedTime = TimeOnly.FromDateTime(DateTime.UtcNow);
                }

                visit.EmployeeId = requestDto.EmployeeId;
                visit.AssignedBy = requestDto.AssignedBy;
                visit.Route = requestDto.Route;
                visit.CustomerName = requestDto.CustomerName;
                visit.Village = requestDto.Village;
                visit.MobileNumber = requestDto.MobileNumber;
                visit.CustomerCategory = requestDto.CustomerCategory;
                visit.ProductId = requestDto.ProductId;
                visit.ProductNames = requestDto.ProductNames;
                visit.ShortNote = requestDto.ShortNote;
                visit.Latitude = requestDto.Latitude;
                visit.Longitude = requestDto.Longitude;
                visit.VisitDate = DateOnly.FromDateTime(requestDto.VisitDate);
                visit.VisitTime = parsedTime;

                _context.Entry(visit).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("FieldVisit with Id {Id} updated successfully.", id);
                return Ok(MapToResponseDto(visit, "Field Visit Updated Successfully"));
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex, "PutFieldVisit: Concurrency exception for FieldVisit Id {Id}.", id);
                return NotFound(new { message = $"FieldVisit with Id {id} not found during update." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating FieldVisit with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Deletes a field visit record.
        /// </summary>
        /// <param name="id">The unique identifier of the field visit to delete.</param>
        /// <returns>No content on success.</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteFieldVisit(int id)
        {
            try
            {
                var visit = await _context.FieldVisits.FindAsync(id);
                if (visit == null)
                {
                    _logger.LogWarning("DeleteFieldVisit: FieldVisit with Id {Id} not found.", id);
                    return NotFound(new { message = $"FieldVisit with Id {id} not found." });
                }

                _context.FieldVisits.Remove(visit);
                await _context.SaveChangesAsync();

                _logger.LogInformation("FieldVisit with Id {Id} deleted successfully.", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting FieldVisit with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Helper to consistently map a FieldVisit entity to FieldVisitResponseDto.
        /// </summary>
        private FieldVisitResponseDto MapToResponseDto(FieldVisit visit, string message)
        {
            return new FieldVisitResponseDto
            {
                Id = visit.Id,
                EmployeeId = visit.EmployeeId,
                AssignedBy = visit.AssignedBy,
                Route = visit.Route,
                CustomerName = visit.CustomerName,
                Village = visit.Village,
                MobileNumber = visit.MobileNumber,
                CustomerCategory = visit.CustomerCategory,
                ProductId = visit.ProductId,
                ProductName = !string.IsNullOrEmpty(visit.ProductNames) ? visit.ProductNames : visit.Product?.ProductName,
                ShortNote = visit.ShortNote,
                Latitude = visit.Latitude,
                Longitude = visit.Longitude,
                VisitDate = visit.VisitDate,
                VisitTime = visit.VisitTime,
                Message = message
            };
        }
    }
}
