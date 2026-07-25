using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using NavbharatAgroAPI.Models;

namespace NavbharatAgroAPI.Data
{
    public static class DbInitializer
    {
        public static void SeedEmployees(AppDbContext context)
        {
            if (context == null) return;

            // Ensure all required columns exist in PostgreSQL Employees table BEFORE any EF Core LINQ queries run
            try
            {
                context.Database.ExecuteSqlRaw(@"
                    ALTER TABLE ""Employees"" ADD COLUMN IF NOT EXISTS ""SelectedRouteCode"" text NULL;
                    ALTER TABLE ""Employees"" ADD COLUMN IF NOT EXISTS ""TripStatus"" text NULL;
                    ALTER TABLE ""Employees"" ADD COLUMN IF NOT EXISTS ""TripStartTime"" timestamp with time zone NULL;
                    ALTER TABLE ""Employees"" ADD COLUMN IF NOT EXISTS ""TripEndTime"" timestamp with time zone NULL;
                    ALTER TABLE ""Employees"" ADD COLUMN IF NOT EXISTS ""AssignedArea"" text NULL;
                ");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database column initialization note: {ex.Message}");
            }

            // Explicitly remove incorrect record Prutivraj (EmployeeCode: EMP002 or Name: Prutivraj)
var incorrectPrutivraj = context.Employees
    .AsEnumerable()
    .Where(e =>
        e.EmployeeCode == "EMP002" ||
        e.Name.Trim().Equals("Prutivraj", StringComparison.OrdinalIgnoreCase) ||
        (e.Name.ToLower().Contains("prutivraj") &&
         !e.Name.ToLower().Contains("pruthviraj"))
    )
    .ToList();
            if (incorrectPrutivraj.Any())
            {
                context.Employees.RemoveRange(incorrectPrutivraj);
                context.SaveChanges();
            }

            // Remove any other duplicate employees with exact same normalized name
            var allEmps = context.Employees.ToList();
            var seenNames = new System.Collections.Generic.HashSet<string>();
            foreach (var emp in allEmps)
            {
                var cleanName = emp.Name.Replace(" Employee", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower();
                if (seenNames.Contains(cleanName))
                {
                    context.Employees.Remove(emp);
                }
                else
                {
                    seenNames.Add(cleanName);
                }
            }
            context.SaveChanges();

            // Ensure Kunal exists
            if (!context.Employees.Any(e => e.Name.ToLower().Contains("kunal")))
            {
                context.Employees.Add(new Employee
                {
                    Id = 1,
                    Name = "Kunal Employee",
                    EmployeeCode = "K001",
                    MobileNumber = "9876543210",
                    AssignedArea = "Kumbharwada",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Ensure Pruthviraj exists
            if (!context.Employees.Any(e => e.Name.ToLower().Contains("pruthviraj")))
            {
                context.Employees.Add(new Employee
                {
                    Id = 2,
                    Name = "Pruthviraj Employee",
                    EmployeeCode = "P001",
                    MobileNumber = "9876543211",
                    AssignedArea = "Nesari",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Ensure Rohit exists
            if (!context.Employees.Any(e => e.Name.ToLower().Contains("rohit")))
            {
                context.Employees.Add(new Employee
                {
                    Id = 3,
                    Name = "Rohit Employee",
                    EmployeeCode = "R001",
                    MobileNumber = "9876543212",
                    AssignedArea = "Nagpur",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            context.SaveChanges();
        }
    }
}
