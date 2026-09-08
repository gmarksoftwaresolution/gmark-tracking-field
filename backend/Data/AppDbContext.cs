using Microsoft.EntityFrameworkCore;
using NavbharatAgroAPI.Models;

namespace NavbharatAgroAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; }
        public DbSet<OrderBooking> OrderBookings { get; set; }
        public DbSet<OrderProduct> OrderProducts { get; set; }
        public DbSet<FieldVisit> FieldVisits { get; set; }
        public DbSet<RouteMaster> RouteMasters { get; set; }
        public DbSet<Product> Products { get; set; }

        // Master Data Foundation DbSets
        public DbSet<RoleMaster> RoleMasters { get; set; }
        public DbSet<PermissionMaster> PermissionMasters { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<BranchMaster> BranchMasters { get; set; }
        public DbSet<DepartmentMaster> DepartmentMasters { get; set; }
        public DbSet<DesignationMaster> DesignationMasters { get; set; }
        public DbSet<ShiftMaster> ShiftMasters { get; set; }
        public DbSet<LeaveTypeMaster> LeaveTypeMasters { get; set; }
        public DbSet<HolidayMaster> HolidayMasters { get; set; }

        // Attendance Module DbSets
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Employee Indexes and Configurations
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.EmployeeCode)
                .IsUnique();
                
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.MobileNumber);

            // 2. OrderBooking Relationships and Indexes
            modelBuilder.Entity<OrderBooking>()
                .HasOne(ob => ob.Employee)
                .WithMany(e => e.OrderBookings)
                .HasForeignKey(ob => ob.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);
                
            modelBuilder.Entity<OrderBooking>()
                .HasIndex(ob => ob.BookingDate);

            // 3. FieldVisit Relationships and Indexes
            modelBuilder.Entity<FieldVisit>()
                .HasOne(fv => fv.Employee)
                .WithMany(e => e.FieldVisits)
                .HasForeignKey(fv => fv.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<FieldVisit>()
                .HasIndex(fv => fv.VisitDate);

            // 4. OrderProduct Relationships and Constraints
            modelBuilder.Entity<OrderProduct>()
                .HasOne(op => op.OrderBooking)
                .WithMany(ob => ob.OrderProducts)
                .HasForeignKey(op => op.OrderBookingId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderProduct>()
                .ToTable(t => t.HasCheckConstraint("CK_OrderProduct_Quantity", "\"Quantity\" > 0"))
                .ToTable(t => t.HasCheckConstraint("CK_OrderProduct_UnitPrice", "\"UnitPrice\" >= 0"));

            // 5. RouteMaster Relationships and Indexes
            modelBuilder.Entity<RouteMaster>()
                .HasIndex(rm => rm.RouteCode)
                .IsUnique();

            modelBuilder.Entity<RouteMaster>()
                .HasOne(rm => rm.AssignedEmployee)
                .WithMany()
                .HasForeignKey(rm => rm.AssignedEmployeeId)
                .OnDelete(DeleteBehavior.SetNull);

            // 6. Product Indexes and Seed Data
            modelBuilder.Entity<Product>()
                .HasIndex(p => p.ProductCode)
                .IsUnique();

            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, ProductCode = "P01", ProductName = "Grow Max 1Kg", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 2, ProductCode = "P02", ProductName = "Grow Max 300gm", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 3, ProductCode = "P03", ProductName = "Navmin 1Kg", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 4, ProductCode = "P04", ProductName = "Navmin 5Kg", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 5, ProductCode = "P05", ProductName = "Navmin 20Kg", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 6, ProductCode = "P06", ProductName = "Garbhacare 1Kg", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 7, ProductCode = "P07", ProductName = "Heat Plus 2.750Kg", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 8, ProductCode = "P08", ProductName = "Heat Plus 400gm", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 9, ProductCode = "P09", ProductName = "Milkmax 1Ltr", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 10, ProductCode = "P10", ProductName = "Milkmax 5Ltr", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 11, ProductCode = "P11", ProductName = "Fat Max 1Kg", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 12, ProductCode = "P12", ProductName = "Fat Max 300gm", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 13, ProductCode = "P13", ProductName = "MustGuard 250gm", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 14, ProductCode = "P14", ProductName = "MustGuard 500gm", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 15, ProductCode = "P15", ProductName = "Murghas", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new Product { Id = 16, ProductCode = "P16", ProductName = "Sarki", DealerPrice = 0, DairyFarmerPrice = 0, IsActive = true, CreatedAt = new System.DateTime(2023, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) }
            );

            // 7. Master Data Foundation Configurations & Indexes
            modelBuilder.Entity<RolePermission>()
                .HasKey(rp => new { rp.RoleId, rp.PermissionId });

            modelBuilder.Entity<RoleMaster>()
                .HasIndex(r => r.RoleCode)
                .IsUnique();

            modelBuilder.Entity<PermissionMaster>()
                .HasIndex(p => p.PermissionCode)
                .IsUnique();

            modelBuilder.Entity<BranchMaster>()
                .HasIndex(b => b.BranchCode)
                .IsUnique();

            modelBuilder.Entity<DepartmentMaster>()
                .HasIndex(d => d.DepartmentCode)
                .IsUnique();

            modelBuilder.Entity<DesignationMaster>()
                .HasIndex(d => d.DesignationCode)
                .IsUnique();

            modelBuilder.Entity<ShiftMaster>()
                .HasIndex(s => s.ShiftCode)
                .IsUnique();

            modelBuilder.Entity<LeaveTypeMaster>()
                .HasIndex(l => l.LeaveTypeCode)
                .IsUnique();

            // Employee Foreign Key Delete Behaviors
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Role)
                .WithMany(r => r.Employees)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Branch)
                .WithMany(b => b.Employees)
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Designation)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DesignationId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Shift)
                .WithMany(s => s.Employees)
                .HasForeignKey(e => e.ShiftId)
                .OnDelete(DeleteBehavior.SetNull);

            // Master Data Seed Data
            modelBuilder.Entity<RoleMaster>().HasData(
                new RoleMaster { Id = 1, RoleName = "Super Admin", RoleCode = "SUPER_ADMIN", Description = "Full System & Master Data Access", IsActive = true, CreatedAt = new System.DateTime(2026, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new RoleMaster { Id = 2, RoleName = "Admin", RoleCode = "ADMIN", Description = "Administrative Access", IsActive = true, CreatedAt = new System.DateTime(2026, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new RoleMaster { Id = 3, RoleName = "Branch Manager", RoleCode = "BRANCH_MGR", Description = "Branch & Team Management", IsActive = true, CreatedAt = new System.DateTime(2026, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new RoleMaster { Id = 4, RoleName = "Field Employee", RoleCode = "FIELD_EMP", Description = "Field Staff & Mobile Access", IsActive = true, CreatedAt = new System.DateTime(2026, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) }
            );

            modelBuilder.Entity<LeaveTypeMaster>().HasData(
                new LeaveTypeMaster { Id = 1, LeaveTypeName = "Casual Leave", LeaveTypeCode = "CL", MaxDaysPerYear = 12, IsPaid = true, IsActive = true, CreatedAt = new System.DateTime(2026, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new LeaveTypeMaster { Id = 2, LeaveTypeName = "Sick Leave", LeaveTypeCode = "SL", MaxDaysPerYear = 10, IsPaid = true, IsActive = true, CreatedAt = new System.DateTime(2026, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new LeaveTypeMaster { Id = 3, LeaveTypeName = "Earned Leave", LeaveTypeCode = "EL", MaxDaysPerYear = 15, IsPaid = true, IsActive = true, CreatedAt = new System.DateTime(2026, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) },
                new LeaveTypeMaster { Id = 4, LeaveTypeName = "Loss of Pay", LeaveTypeCode = "LOP", MaxDaysPerYear = 0, IsPaid = false, IsActive = true, CreatedAt = new System.DateTime(2026, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) }
            );

            modelBuilder.Entity<ShiftMaster>().HasData(
                new ShiftMaster { Id = 1, ShiftName = "General Morning Shift", ShiftCode = "SH_MORNING", StartTime = new System.TimeSpan(9, 0, 0), EndTime = new System.TimeSpan(18, 0, 0), BreakDurationMinutes = 60, GracePeriodMinutes = 15, HalfDayHoursThreshold = 4.5, FullDayHoursThreshold = 8.0, IsOvernight = false, IsActive = true, CreatedAt = new System.DateTime(2026, 1, 1, 0, 0, 0, System.DateTimeKind.Utc) }
            );

            // AttendanceRecord Indexes & Foreign Keys
            modelBuilder.Entity<AttendanceRecord>()
                .HasIndex(a => new { a.EmployeeId, a.AttendanceDate })
                .IsUnique();

            modelBuilder.Entity<AttendanceRecord>()
                .HasOne(a => a.Employee)
                .WithMany()
                .HasForeignKey(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
