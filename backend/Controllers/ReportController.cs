using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NavbharatAgroAPI.Data;
using NavbharatAgroAPI.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NavbharatAgroAPI.Controllers
{
    [Route("api/reports")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ReportController> _logger;

        public ReportController(AppDbContext context, ILogger<ReportController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("daily")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<DailyReportResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<DailyReportResponseDto>>> GetDailyReportAll()
        {
            try
            {
                var today = DateOnly.FromDateTime(DateTime.Now);
                
                var employees = await _context.SalesEmployees.ToListAsync();
                var orderBookings = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.BookingDate == today)
                    .ToListAsync();
                var fieldVisits = await _context.FieldVisits
                    .Where(v => v.VisitDate == today)
                    .ToListAsync();

                var reports = new List<DailyReportResponseDto>();

                foreach (var emp in employees)
                {
                    var empOrders = orderBookings.Where(o => o.EmployeeId == emp.Id).ToList();
                    var pendingOrders = empOrders.Count(o => o.OrderStatus == "Pending");
                    var deliveredOrders = empOrders.Count(o => o.OrderStatus == "Delivered");
                    
                    // Exclude cancelled orders from totals
                    var validOrders = empOrders.Where(o => o.OrderStatus != "Cancelled").ToList();
                    var totalSales = validOrders.Sum(o => o.GrandTotal);
                    var totalFieldVisits = fieldVisits.Count(v => v.EmployeeId == emp.Id);
                    
                    var totalQuantitySold = validOrders.SelectMany(o => o.OrderProducts).Sum(p => p.Quantity);
                    var productsSoldList = validOrders.SelectMany(o => o.OrderProducts)
                        .GroupBy(p => p.ProductName)
                        .Select(g => $"{g.Key} ({g.Sum(x => x.Quantity)})")
                        .ToList();
                    var productsSoldString = productsSoldList.Any() ? string.Join(", ", productsSoldList) : "-";

                    reports.Add(new DailyReportResponseDto
                    {
                        EmployeeId = emp.Id,
                        EmployeeName = emp.Name,
                        TotalOrders = validOrders.Count,
                        PendingOrders = pendingOrders,
                        DeliveredOrders = deliveredOrders,
                        TotalSales = totalSales,
                        TotalFieldVisits = totalFieldVisits,
                        TotalQuantitySold = totalQuantitySold,
                        ProductsSold = productsSoldString
                    });
                }

                return Ok(reports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while generating daily report for all employees.");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        [HttpGet("daily/{employeeId}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(DailyReportResponseDto))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<DailyReportResponseDto>> GetDailyReportByEmployee(int employeeId)
        {
            try
            {
                var today = DateOnly.FromDateTime(DateTime.Now);
                
                var emp = await _context.SalesEmployees.FindAsync(employeeId);
                if (emp == null)
                {
                    return NotFound(new { message = $"Employee with Id {employeeId} not found." });
                }

                var empOrders = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.EmployeeId == employeeId && o.BookingDate == today)
                    .ToListAsync();
                
                var totalFieldVisits = await _context.FieldVisits
                    .CountAsync(v => v.EmployeeId == employeeId && v.VisitDate == today);

                var pendingOrders = empOrders.Count(o => o.OrderStatus == "Pending");
                var deliveredOrders = empOrders.Count(o => o.OrderStatus == "Delivered");
                
                // Exclude cancelled orders from totals
                var validOrders = empOrders.Where(o => o.OrderStatus != "Cancelled").ToList();
                var totalSales = validOrders.Sum(o => o.GrandTotal);
                
                var totalQuantitySold = validOrders.SelectMany(o => o.OrderProducts).Sum(p => p.Quantity);
                var productsSoldList = validOrders.SelectMany(o => o.OrderProducts)
                    .GroupBy(p => p.ProductName)
                    .Select(g => $"{g.Key} ({g.Sum(x => x.Quantity)})")
                    .ToList();
                var productsSoldString = productsSoldList.Any() ? string.Join(", ", productsSoldList) : "-";

                var report = new DailyReportResponseDto
                {
                    EmployeeId = emp.Id,
                    EmployeeName = emp.Name,
                    TotalOrders = validOrders.Count,
                    PendingOrders = pendingOrders,
                    DeliveredOrders = deliveredOrders,
                    TotalSales = totalSales,
                    TotalFieldVisits = totalFieldVisits,
                    TotalQuantitySold = totalQuantitySold,
                    ProductsSold = productsSoldString
                };

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while generating daily report for employee {EmployeeId}.", employeeId);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        [HttpGet("monthly")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<MonthlyReportResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<MonthlyReportResponseDto>>> GetMonthlyReportAll()
        {
            try
            {
                var now = DateTime.Now;
                
                var employees = await _context.SalesEmployees.ToListAsync();
                var orderBookings = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.BookingDate.Year == now.Year && o.BookingDate.Month == now.Month)
                    .ToListAsync();
                var fieldVisits = await _context.FieldVisits
                    .Where(v => v.VisitDate.Year == now.Year && v.VisitDate.Month == now.Month)
                    .ToListAsync();

                var reports = new List<MonthlyReportResponseDto>();

                foreach (var emp in employees)
                {
                    var empOrders = orderBookings.Where(o => o.EmployeeId == emp.Id).ToList();
                    var pendingOrders = empOrders.Count(o => o.OrderStatus == "Pending");
                    var deliveredOrders = empOrders.Count(o => o.OrderStatus == "Delivered");
                    
                    // Exclude cancelled orders from totals
                    var validOrders = empOrders.Where(o => o.OrderStatus != "Cancelled").ToList();
                    var totalSales = validOrders.Sum(o => o.GrandTotal);
                    var totalFieldVisits = fieldVisits.Count(v => v.EmployeeId == emp.Id);
                    var totalQuantitySold = validOrders.SelectMany(o => o.OrderProducts).Sum(p => p.Quantity);
                    
                    var productsSoldList = validOrders.SelectMany(o => o.OrderProducts)
                        .GroupBy(p => p.ProductName)
                        .Select(g => $"{g.Key} ({g.Sum(x => x.Quantity)})")
                        .ToList();
                    var productsSoldString = productsSoldList.Any() ? string.Join(", ", productsSoldList) : "-";

                    reports.Add(new MonthlyReportResponseDto
                    {
                        EmployeeId = emp.Id,
                        EmployeeName = emp.Name,
                        TotalOrders = validOrders.Count,
                        PendingOrders = pendingOrders,
                        DeliveredOrders = deliveredOrders,
                        TotalSales = totalSales,
                        TotalFieldVisits = totalFieldVisits,
                        TotalQuantitySold = totalQuantitySold,
                        ProductsSold = productsSoldString
                    });
                }

                return Ok(reports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while generating monthly report for all employees.");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        [HttpGet("monthly/{employeeId}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(MonthlyReportResponseDto))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<MonthlyReportResponseDto>> GetMonthlyReportByEmployee(int employeeId)
        {
            try
            {
                var now = DateTime.Now;
                
                var emp = await _context.SalesEmployees.FindAsync(employeeId);
                if (emp == null)
                {
                    return NotFound(new { message = $"Employee with Id {employeeId} not found." });
                }

                var empOrders = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.EmployeeId == employeeId && o.BookingDate.Year == now.Year && o.BookingDate.Month == now.Month)
                    .ToListAsync();
                
                var totalFieldVisits = await _context.FieldVisits
                    .CountAsync(v => v.EmployeeId == employeeId && v.VisitDate.Year == now.Year && v.VisitDate.Month == now.Month);

                var pendingOrders = empOrders.Count(o => o.OrderStatus == "Pending");
                var deliveredOrders = empOrders.Count(o => o.OrderStatus == "Delivered");
                
                // Exclude cancelled orders from totals
                var validOrders = empOrders.Where(o => o.OrderStatus != "Cancelled").ToList();
                var totalSales = validOrders.Sum(o => o.GrandTotal);
                var totalQuantitySold = validOrders.SelectMany(o => o.OrderProducts).Sum(p => p.Quantity);
                
                var productsSoldList = validOrders.SelectMany(o => o.OrderProducts)
                    .GroupBy(p => p.ProductName)
                    .Select(g => $"{g.Key} ({g.Sum(x => x.Quantity)})")
                    .ToList();
                var productsSoldString = productsSoldList.Any() ? string.Join(", ", productsSoldList) : "-";

                var report = new MonthlyReportResponseDto
                {
                    EmployeeId = emp.Id,
                    EmployeeName = emp.Name,
                    TotalOrders = validOrders.Count,
                    PendingOrders = pendingOrders,
                    DeliveredOrders = deliveredOrders,
                    TotalSales = totalSales,
                    TotalFieldVisits = totalFieldVisits,
                    TotalQuantitySold = totalQuantitySold,
                    ProductsSold = productsSoldString
                };

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while generating monthly report for employee {EmployeeId}.", employeeId);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }
    }
}
