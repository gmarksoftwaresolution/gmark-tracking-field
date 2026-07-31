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

            // Ensure table and columns exist in PostgreSQL BEFORE any EF Core LINQ queries run
            try
            {
                context.Database.ExecuteSqlRaw(@"
                    DO $$
                    BEGIN
                        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'Employees') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'SalesEmployees') THEN
                            ALTER TABLE ""Employees"" RENAME TO ""SalesEmployees"";
                        END IF;
                    END $$;
                    
                    ALTER TABLE ""SalesEmployees"" ADD COLUMN IF NOT EXISTS ""SelectedRouteCode"" text NULL;
                    ALTER TABLE ""SalesEmployees"" ADD COLUMN IF NOT EXISTS ""TripStatus"" text NULL;
                    ALTER TABLE ""SalesEmployees"" ADD COLUMN IF NOT EXISTS ""TripStartTime"" timestamp with time zone NULL;
                    ALTER TABLE ""SalesEmployees"" ADD COLUMN IF NOT EXISTS ""TripEndTime"" timestamp with time zone NULL;
                    ALTER TABLE ""SalesEmployees"" ADD COLUMN IF NOT EXISTS ""AssignedArea"" text NULL;
                    ALTER TABLE ""SalesEmployees"" ADD COLUMN IF NOT EXISTS ""EmployeeMasterId"" integer NULL;
                ");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database column initialization note: {ex.Message}");
            }

            // Explicitly remove incorrect record Prutivraj (EmployeeCode: EMP002 or Name: Prutivraj)
            var incorrectPrutivraj = context.SalesEmployees
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
                context.SalesEmployees.RemoveRange(incorrectPrutivraj);
                context.SaveChanges();
            }

            // Remove duplicate sales employees with exact same normalized name
            var allEmps = context.SalesEmployees.ToList();
            var seenNames = new System.Collections.Generic.HashSet<string>();
            foreach (var emp in allEmps)
            {
                var cleanName = emp.Name.Replace(" Employee", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower();
                if (seenNames.Contains(cleanName))
                {
                    context.SalesEmployees.Remove(emp);
                }
                else
                {
                    seenNames.Add(cleanName);
                }
            }
            context.SaveChanges();

            // Ensure Kunal exists and update PasswordHash
            var kunal = context.SalesEmployees.FirstOrDefault(e => e.Name.ToLower().Contains("kunal") || e.EmployeeCode.ToLower().Contains("k001"));
            if (kunal == null)
            {
                context.SalesEmployees.Add(new SalesEmployee
                {
                    Id = 1,
                    Name = "Kunal",
                    EmployeeCode = "K001",
                    MobileNumber = "9876543210",
                    AssignedArea = "Kolhapur",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("gmark@k001"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                kunal.EmployeeCode = "K001";
                kunal.PasswordHash = BCrypt.Net.BCrypt.HashPassword("gmark@k001");
            }

            // Ensure Pruthviraj exists and update PasswordHash
            var pruthviraj = context.SalesEmployees.FirstOrDefault(e => e.Name.ToLower().Contains("pruthviraj") || e.EmployeeCode.ToLower().Contains("p001"));
            if (pruthviraj == null)
            {
                context.SalesEmployees.Add(new SalesEmployee
                {
                    Id = 2,
                    Name = "Pruthviraj",
                    EmployeeCode = "P001",
                    MobileNumber = "9876543211",
                    AssignedArea = "Gadhinglaj",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("gmark@p001"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                pruthviraj.EmployeeCode = "P001";
                pruthviraj.PasswordHash = BCrypt.Net.BCrypt.HashPassword("gmark@p001");
            }

            // Ensure Rohit exists and update PasswordHash
            var rohit = context.SalesEmployees.FirstOrDefault(e => e.Name.ToLower().Contains("rohit") || e.EmployeeCode.ToLower().Contains("r001"));
            if (rohit == null)
            {
                context.SalesEmployees.Add(new SalesEmployee
                {
                    Id = 3,
                    Name = "Rohit",
                    EmployeeCode = "R001",
                    MobileNumber = "9876543212",
                    AssignedArea = "Nagpur",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("gmark@r001"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                rohit.EmployeeCode = "R001";
                rohit.PasswordHash = BCrypt.Net.BCrypt.HashPassword("gmark@r001");
            }

            context.SaveChanges();

            // SYNC STEP: Auto-create missing EmployeeMaster records for existing SalesEmployees
            var salesList = context.SalesEmployees.ToList();
            var salesDept = context.Departments.FirstOrDefault(d => d.Name.ToLower() == "sales");
            int salesDeptId = salesDept?.Id ?? 1;

            foreach (var sEmp in salesList)
            {
                // Check if an EmployeeMaster record exists for this SalesEmployee
                EmployeeMaster? master = null;

                if (sEmp.EmployeeMasterId.HasValue)
                {
                    master = context.EmployeeMasters.FirstOrDefault(em => em.Id == sEmp.EmployeeMasterId.Value);
                }

                if (master == null)
                {
                    master = context.EmployeeMasters.FirstOrDefault(em => em.EmployeeCode.ToLower() == sEmp.EmployeeCode.ToLower());
                }

                if (master == null)
                {
                    // Create missing EmployeeMaster record once
                    master = new EmployeeMaster
                    {
                        EmployeeCode = sEmp.EmployeeCode,
                        EmployeeId = $"EMP-2026-{sEmp.EmployeeCode}",
                        FirstName = sEmp.Name,
                        LastName = ".",
                        MobileNumber = sEmp.MobileNumber,
                        DepartmentId = salesDeptId,
                        DepartmentName = "Sales",
                        BranchName = sEmp.AssignedArea ?? "Head Office",
                        PasswordHash = sEmp.PasswordHash,
                        EmployeeStatus = sEmp.IsActive ? "Active" : "Inactive",
                        CreatedAt = sEmp.CreatedAt
                    };

                    context.EmployeeMasters.Add(master);
                    context.SaveChanges();
                }

                // Ensure FK link is set
                if (sEmp.EmployeeMasterId != master.Id)
                {
                    sEmp.EmployeeMasterId = master.Id;
                }
            }

            context.SaveChanges();
        }
    }
}
