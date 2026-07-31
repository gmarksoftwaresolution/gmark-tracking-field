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
    /// Manages Order Bookings and their associated Products.
    /// </summary>
    [Route("api/orderbookings")]
    [ApiController]
    public class OrderBookingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<OrderBookingController> _logger;

        public OrderBookingController(AppDbContext context, ILogger<OrderBookingController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves a list of all order bookings, including their products.
        /// </summary>
        /// <returns>A list of OrderBookingResponseDto.</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrderBookingResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<OrderBookingResponseDto>>> GetOrderBookings()
        {
            try
            {
                var bookings = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .ToListAsync();

                return Ok(bookings.Select(o => MapToResponseDto(o, "Retrieved Successfully")));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting all order bookings.");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Retrieves a list of pending order bookings, including their products.
        /// </summary>
        /// <returns>A list of OrderBookingResponseDto.</returns>
        [HttpGet("pending")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrderBookingResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<OrderBookingResponseDto>>> GetPendingOrderBookings()
        {
            try
            {
                var bookings = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.OrderStatus == "Pending")
                    .ToListAsync();

                return Ok(bookings.Select(o => MapToResponseDto(o, "Retrieved Successfully")));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting pending order bookings.");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Retrieves a list of delivered order bookings, including their products.
        /// </summary>
        /// <returns>A list of OrderBookingResponseDto.</returns>
        [HttpGet("delivered")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrderBookingResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<OrderBookingResponseDto>>> GetDeliveredOrderBookings()
        {
            try
            {
                var bookings = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.OrderStatus == "Delivered")
                    .ToListAsync();

                return Ok(bookings.Select(o => MapToResponseDto(o, "Retrieved Successfully")));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting delivered order bookings.");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Retrieves a list of cancelled order bookings, including their products.
        /// </summary>
        /// <returns>A list of OrderBookingResponseDto.</returns>
        [HttpGet("cancelled")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrderBookingResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<OrderBookingResponseDto>>> GetCancelledOrderBookings()
        {
            try
            {
                var bookings = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.OrderStatus == "Cancelled")
                    .ToListAsync();

                return Ok(bookings.Select(o => MapToResponseDto(o, "Retrieved Successfully")));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting cancelled order bookings.");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Retrieves a list of all order bookings for a specific employee.
        /// </summary>
        /// <param name="employeeId">The unique identifier of the employee.</param>
        /// <returns>A list of OrderBookingResponseDto.</returns>
        [HttpGet("employee/{employeeId}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrderBookingResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<OrderBookingResponseDto>>> GetOrderBookingsByEmployee(int employeeId)
        {
            try
            {
                var bookings = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.EmployeeId == employeeId)
                    .ToListAsync();

                return Ok(bookings.Select(o => MapToResponseDto(o, "Retrieved Successfully")));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting order bookings for employee {EmployeeId}.", employeeId);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Retrieves a list of pending order bookings for a specific employee.
        /// </summary>
        /// <param name="employeeId">The unique identifier of the employee.</param>
        /// <returns>A list of OrderBookingResponseDto.</returns>
        [HttpGet("employee/{employeeId}/pending")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrderBookingResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<OrderBookingResponseDto>>> GetPendingOrderBookingsByEmployee(int employeeId)
        {
            try
            {
                var bookings = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.EmployeeId == employeeId && o.OrderStatus == "Pending")
                    .ToListAsync();

                return Ok(bookings.Select(o => MapToResponseDto(o, "Retrieved Successfully")));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting pending order bookings for employee {EmployeeId}.", employeeId);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Retrieves a list of delivered order bookings for a specific employee.
        /// </summary>
        /// <param name="employeeId">The unique identifier of the employee.</param>
        /// <returns>A list of OrderBookingResponseDto.</returns>
        [HttpGet("employee/{employeeId}/delivered")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrderBookingResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<OrderBookingResponseDto>>> GetDeliveredOrderBookingsByEmployee(int employeeId)
        {
            try
            {
                var bookings = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.EmployeeId == employeeId && o.OrderStatus == "Delivered")
                    .ToListAsync();

                return Ok(bookings.Select(o => MapToResponseDto(o, "Retrieved Successfully")));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting delivered order bookings for employee {EmployeeId}.", employeeId);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Retrieves a list of cancelled order bookings for a specific employee.
        /// </summary>
        /// <param name="employeeId">The unique identifier of the employee.</param>
        /// <returns>A list of OrderBookingResponseDto.</returns>
        [HttpGet("employee/{employeeId}/cancelled")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrderBookingResponseDto>))]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<OrderBookingResponseDto>>> GetCancelledOrderBookingsByEmployee(int employeeId)
        {
            try
            {
                var bookings = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .Where(o => o.EmployeeId == employeeId && o.OrderStatus == "Cancelled")
                    .ToListAsync();

                return Ok(bookings.Select(o => MapToResponseDto(o, "Retrieved Successfully")));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting cancelled order bookings for employee {EmployeeId}.", employeeId);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Retrieves a specific order booking by its ID, including its products.
        /// </summary>
        /// <param name="id">The unique identifier of the order booking.</param>
        /// <returns>The OrderBookingResponseDto.</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(OrderBookingResponseDto))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<OrderBookingResponseDto>> GetOrderBooking(int id)
        {
            try
            {
                var orderBooking = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (orderBooking == null)
                {
                    _logger.LogWarning("GetOrderBooking: OrderBooking with Id {Id} not found.", id);
                    return NotFound(new { message = $"OrderBooking with Id {id} not found." });
                }

                return Ok(MapToResponseDto(orderBooking, "Retrieved Successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting OrderBooking with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Creates a new order booking along with its products.
        /// </summary>
        /// <param name="requestDto">The order booking details.</param>
        /// <returns>The created OrderBookingResponseDto.</returns>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(OrderBookingResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<OrderBookingResponseDto>> PostOrderBooking(OrderBookingRequestDto requestDto)
        {
            try
            {
                // Validate EmployeeId
                bool employeeExists = await _context.SalesEmployees.AnyAsync(e => e.Id == requestDto.EmployeeId);
                if (!employeeExists)
                {
                    _logger.LogWarning("PostOrderBooking: Employee with Id {Id} does not exist.", requestDto.EmployeeId);
                    return BadRequest(new { message = $"Employee with Id {requestDto.EmployeeId} does not exist." });
                }

                if (!TimeOnly.TryParse(requestDto.BookingTime, out TimeOnly parsedTime))
                {
                    _logger.LogWarning("PostOrderBooking: Failed to parse BookingTime '{Time}'. Using current time.", requestDto.BookingTime);
                    parsedTime = TimeOnly.FromDateTime(DateTime.UtcNow);
                }

                var orderBooking = new OrderBooking
                {
                    EmployeeId = requestDto.EmployeeId,
                    AssignedBy = requestDto.AssignedBy,
                    Route = string.IsNullOrWhiteSpace(requestDto.Route) ? "General Route" : requestDto.Route,
                    CustomerName = requestDto.CustomerName,
                    Village = requestDto.Village,
                    MobileNumber = requestDto.MobileNumber,
                    CustomerCategory = requestDto.CustomerCategory,
                    OrderStatus = "Pending",
                    BookingDate = DateOnly.FromDateTime(requestDto.BookingDate),
                    BookingTime = parsedTime,
                    Latitude = requestDto.Latitude,
                    Longitude = requestDto.Longitude,
                    GrandTotal = 0,
                    OrderProducts = new List<OrderProduct>()
                };

                decimal grandTotal = 0;

                if (requestDto.Products != null && requestDto.Products.Any())
                {
                    var productNames = requestDto.Products.Select(p => p.ProductName).Distinct().ToList();
                    var dbProducts = await _context.Products
                        .Where(p => productNames.Contains(p.ProductName))
                        .ToDictionaryAsync(p => p.ProductName, StringComparer.OrdinalIgnoreCase);

                    foreach (var p in requestDto.Products)
                    {
                        if (!dbProducts.TryGetValue(p.ProductName, out var dbProduct))
                        {
                            return BadRequest(new { message = $"Product '{p.ProductName}' not found in Product Master." });
                        }

                        decimal unitPrice = p.UnitPrice ?? 0;
                        if (unitPrice == 0)
                        {
                            if (string.Equals(requestDto.CustomerCategory, "Dealer", StringComparison.OrdinalIgnoreCase))
                            {
                                unitPrice = dbProduct.DealerPrice;
                            }
                            else if (string.Equals(requestDto.CustomerCategory, "Dairy Farmer", StringComparison.OrdinalIgnoreCase))
                            {
                                unitPrice = dbProduct.DairyFarmerPrice;
                            }
                        }

                        var rowTotal = unitPrice * p.Quantity;
                        grandTotal += rowTotal;

                        orderBooking.OrderProducts.Add(new OrderProduct
                        {
                            ProductName = p.ProductName,
                            UnitPrice = unitPrice,
                            Quantity = p.Quantity,
                            RowTotal = rowTotal
                        });
                    }
                }

                orderBooking.GrandTotal = grandTotal;

                _context.OrderBookings.Add(orderBooking);
                
                // Saving OrderBooking and its Products in a single transaction
                await _context.SaveChangesAsync();

                _logger.LogInformation("OrderBooking with Id {Id} created successfully.", orderBooking.Id);
                
                var responseDto = MapToResponseDto(orderBooking, "Order Booking Saved Successfully");
                return CreatedAtAction(nameof(GetOrderBooking), new { id = orderBooking.Id }, responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating a new OrderBooking.");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Updates an existing order booking and syncs its products.
        /// </summary>
        /// <param name="id">The unique identifier of the order booking.</param>
        /// <param name="requestDto">The updated order details.</param>
        /// <returns>A success message.</returns>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(OrderBookingResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<OrderBookingResponseDto>> PutOrderBooking(int id, OrderBookingRequestDto requestDto)
        {
            try
            {
                // Validate EmployeeId
                bool employeeExists = await _context.SalesEmployees.AnyAsync(e => e.Id == requestDto.EmployeeId);
                if (!employeeExists)
                {
                    _logger.LogWarning("PutOrderBooking: Employee with Id {Id} does not exist.", requestDto.EmployeeId);
                    return BadRequest(new { message = $"Employee with Id {requestDto.EmployeeId} does not exist." });
                }

                var orderBooking = await _context.OrderBookings
                    .Include(o => o.OrderProducts)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (orderBooking == null)
                {
                    _logger.LogWarning("PutOrderBooking: OrderBooking with Id {Id} not found.", id);
                    return NotFound(new { message = $"OrderBooking with Id {id} not found." });
                }

                if (!TimeOnly.TryParse(requestDto.BookingTime, out TimeOnly parsedTime))
                {
                    _logger.LogWarning("PutOrderBooking: Failed to parse BookingTime '{Time}'. Using current time.", requestDto.BookingTime);
                    parsedTime = TimeOnly.FromDateTime(DateTime.UtcNow);
                }

                // Update standard properties
                orderBooking.EmployeeId = requestDto.EmployeeId;
                orderBooking.AssignedBy = requestDto.AssignedBy;
                orderBooking.Route = requestDto.Route;
                orderBooking.CustomerName = requestDto.CustomerName;
                orderBooking.Village = requestDto.Village;
                orderBooking.MobileNumber = requestDto.MobileNumber;
                orderBooking.CustomerCategory = requestDto.CustomerCategory;
                orderBooking.BookingDate = DateOnly.FromDateTime(requestDto.BookingDate);
                orderBooking.BookingTime = parsedTime;

                // Handle Products Merge (Replace all)
                if (requestDto.Products == null)
                {
                    requestDto.Products = new List<OrderProductRequestDto>();
                }

                // Remove all existing products
                _context.OrderProducts.RemoveRange(orderBooking.OrderProducts.ToList());
                orderBooking.OrderProducts.Clear();

                decimal grandTotal = 0;

                // Add new products
                if (requestDto.Products.Any())
                {
                    var productNames = requestDto.Products.Select(p => p.ProductName).Distinct().ToList();
                    var dbProducts = await _context.Products
                        .Where(p => productNames.Contains(p.ProductName))
                        .ToDictionaryAsync(p => p.ProductName, StringComparer.OrdinalIgnoreCase);

                    foreach (var dtoProduct in requestDto.Products)
                    {
                        if (!dbProducts.TryGetValue(dtoProduct.ProductName, out var dbProduct))
                        {
                            return BadRequest(new { message = $"Product '{dtoProduct.ProductName}' not found in Product Master." });
                        }

                        decimal unitPrice = dtoProduct.UnitPrice ?? 0;
                        if (unitPrice == 0)
                        {
                            if (string.Equals(requestDto.CustomerCategory, "Dealer", StringComparison.OrdinalIgnoreCase))
                            {
                                unitPrice = dbProduct.DealerPrice;
                            }
                            else if (string.Equals(requestDto.CustomerCategory, "Dairy Farmer", StringComparison.OrdinalIgnoreCase))
                            {
                                unitPrice = dbProduct.DairyFarmerPrice;
                            }
                        }

                        var rowTotal = unitPrice * dtoProduct.Quantity;
                        grandTotal += rowTotal;

                        orderBooking.OrderProducts.Add(new OrderProduct
                        {
                            ProductName = dtoProduct.ProductName,
                            UnitPrice = unitPrice,
                            Quantity = dtoProduct.Quantity,
                            RowTotal = rowTotal
                        });
                    }
                }

                orderBooking.GrandTotal = grandTotal;

                _context.Entry(orderBooking).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("OrderBooking with Id {Id} updated successfully.", id);
                return Ok(MapToResponseDto(orderBooking, "Order Booking Updated Successfully"));
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex, "PutOrderBooking: Concurrency exception for OrderBooking Id {Id}.", id);
                return NotFound(new { message = $"OrderBooking with Id {id} not found during update." });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "PutOrderBooking: Database update exception for OrderBooking Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "A database error occurred while updating the order booking.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating OrderBooking with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Deletes an order booking and cascades to delete all associated products.
        /// </summary>
        /// <param name="id">The unique identifier of the order booking to delete.</param>
        /// <returns>No content on success.</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteOrderBooking(int id)
        {
            try
            {
                var orderBooking = await _context.OrderBookings.FindAsync(id);
                if (orderBooking == null)
                {
                    _logger.LogWarning("DeleteOrderBooking: OrderBooking with Id {Id} not found.", id);
                    return NotFound(new { message = $"OrderBooking with Id {id} not found." });
                }

                _context.OrderBookings.Remove(orderBooking);
                await _context.SaveChangesAsync();

                _logger.LogInformation("OrderBooking with Id {Id} deleted successfully.", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting OrderBooking with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Marks an order booking as Delivered.
        /// </summary>
        /// <param name="id">The unique identifier of the order booking.</param>
        /// <returns>A success message.</returns>
        [HttpPut("{id}/deliver")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeliverOrderBooking(int id)
        {
            try
            {
                var orderBooking = await _context.OrderBookings.FindAsync(id);
                if (orderBooking == null)
                {
                    _logger.LogWarning("DeliverOrderBooking: OrderBooking with Id {Id} not found.", id);
                    return NotFound(new { message = $"OrderBooking with Id {id} not found." });
                }

                orderBooking.OrderStatus = "Delivered";
                await _context.SaveChangesAsync();

                _logger.LogInformation("OrderBooking with Id {Id} marked as Delivered successfully.", id);
                return Ok(new { message = "Order Delivered Successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while marking OrderBooking with Id {Id} as Delivered.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Cancels an order booking with a reason.
        /// </summary>
        /// <param name="id">The unique identifier of the order booking.</param>
        /// <param name="cancelDto">The cancellation reason.</param>
        /// <returns>A success message.</returns>
        [HttpPut("{id}/cancel")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CancelOrderBooking(int id, [FromBody] CancelOrderDto cancelDto)
        {
            try
            {
                var orderBooking = await _context.OrderBookings.FindAsync(id);
                if (orderBooking == null)
                {
                    _logger.LogWarning("CancelOrderBooking: OrderBooking with Id {Id} not found.", id);
                    return NotFound(new { message = $"OrderBooking with Id {id} not found." });
                }

                orderBooking.OrderStatus = "Cancelled";
                orderBooking.CancellationReason = cancelDto.Reason;
                await _context.SaveChangesAsync();

                _logger.LogInformation("OrderBooking with Id {Id} cancelled successfully.", id);
                return Ok(new { message = "Order Cancelled Successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while cancelling OrderBooking with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        /// <summary>
        /// Helper to consistently map an OrderBooking entity to OrderBookingResponseDto.
        /// </summary>
        private OrderBookingResponseDto MapToResponseDto(OrderBooking orderBooking, string message)
        {
            return new OrderBookingResponseDto
            {
                Id = orderBooking.Id,
                EmployeeId = orderBooking.EmployeeId,
                AssignedBy = orderBooking.AssignedBy,
                Route = orderBooking.Route,
                CustomerName = orderBooking.CustomerName,
                Village = orderBooking.Village,
                MobileNumber = orderBooking.MobileNumber,
                CustomerCategory = orderBooking.CustomerCategory,
                OrderStatus = orderBooking.OrderStatus ?? "Pending",
                CancellationReason = orderBooking.CancellationReason,
                GrandTotal = orderBooking.GrandTotal,
                BookingDate = orderBooking.BookingDate,
                BookingTime = orderBooking.BookingTime,
                Latitude = orderBooking.Latitude,
                Longitude = orderBooking.Longitude,
                Products = orderBooking.OrderProducts?.Select(p => new OrderProductResponseDto
                {
                    Id = p.Id,
                    ProductName = p.ProductName,
                    UnitPrice = p.UnitPrice,
                    Quantity = p.Quantity,
                    RowTotal = p.RowTotal
                }).ToList() ?? new List<OrderProductResponseDto>(),
                Message = message
            };
        }

        /// <summary>
        /// Updates the grand total of an order booking directly.
        /// </summary>
        [HttpPut("{id}/total")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateOrderTotal(int id, [FromBody] UpdateTotalDto dto)
        {
            try
            {
                var orderBooking = await _context.OrderBookings.FindAsync(id);
                if (orderBooking == null)
                {
                    _logger.LogWarning("UpdateOrderTotal: OrderBooking with Id {Id} not found.", id);
                    return NotFound(new { message = $"OrderBooking with Id {id} not found." });
                }

                orderBooking.GrandTotal = dto.Total;
                await _context.SaveChangesAsync();

                _logger.LogInformation("OrderBooking with Id {Id} total updated to {Total} successfully.", id, dto.Total);
                return Ok(new { message = "Total updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating total for OrderBooking with Id {Id}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
            }
        }

        [HttpGet("fix-zeros")]
        public async Task<IActionResult> FixZeros()
        {
            var orders = await _context.OrderBookings.Include(o => o.OrderProducts).Where(o => o.GrandTotal == 0).ToListAsync();
            var products = await _context.Products.ToListAsync();
            int updated = 0;
            foreach (var order in orders)
            {
                decimal newTotal = 0;
                foreach (var p in order.OrderProducts)
                {
                    if (p.UnitPrice == 0)
                    {
                        var prod = products.FirstOrDefault(pr => pr.ProductName.Trim().Equals(p.ProductName.Trim(), StringComparison.OrdinalIgnoreCase));
                        if (prod != null)
                        {
                            decimal price = string.Equals(order.CustomerCategory, "Dairy Farmer", StringComparison.OrdinalIgnoreCase) ? prod.DairyFarmerPrice : prod.DealerPrice;
                            p.UnitPrice = price;
                            p.RowTotal = price * p.Quantity;
                        }
                    }
                    newTotal += p.RowTotal;
                }
                if (newTotal > 0)
                {
                    order.GrandTotal = newTotal;
                    _context.Entry(order).State = EntityState.Modified;
                    updated++;
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Fixed {updated} orders" });
        }
    }
}
