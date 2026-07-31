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

        public DbSet<SalesEmployee> SalesEmployees { get; set; }
        public DbSet<EmployeeMaster> EmployeeMasters { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Designation> Designations { get; set; }
        public DbSet<RoleMaster> RoleMasters { get; set; }
        public DbSet<Branch> Branches { get; set; }
        public DbSet<OrderBooking> OrderBookings { get; set; }
        public DbSet<OrderProduct> OrderProducts { get; set; }
        public DbSet<FieldVisit> FieldVisits { get; set; }
        public DbSet<RouteMaster> RouteMasters { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<CustomerMaster> CustomerMasters { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // CustomerMaster Indexes
            modelBuilder.Entity<CustomerMaster>()
                .HasIndex(cm => cm.CustomerCode)
                .IsUnique();

            modelBuilder.Entity<CustomerMaster>()
                .HasIndex(cm => cm.CustomerId)
                .IsUnique();

            // 1. SalesEmployee Table Mapping, Indexes and Configurations
            modelBuilder.Entity<SalesEmployee>()
                .ToTable("SalesEmployees");

            modelBuilder.Entity<SalesEmployee>()
                .HasIndex(e => e.EmployeeCode)
                .IsUnique();
                
            modelBuilder.Entity<SalesEmployee>()
                .HasIndex(e => e.MobileNumber);

            modelBuilder.Entity<SalesEmployee>()
                .HasOne(e => e.EmployeeMaster)
                .WithMany()
                .HasForeignKey(e => e.EmployeeMasterId)
                .OnDelete(DeleteBehavior.SetNull);

            // 1b. EmployeeMaster Indexes and Configurations
            modelBuilder.Entity<EmployeeMaster>()
                .HasIndex(em => em.EmployeeCode)
                .IsUnique();

            modelBuilder.Entity<EmployeeMaster>()
                .HasIndex(em => em.EmployeeId);

            modelBuilder.Entity<EmployeeMaster>()
                .HasIndex(em => em.EmailAddress);

            // Master Lookup Seed Data
            modelBuilder.Entity<Department>().HasData(
                new Department { Id = 1, Name = "Sales", Code = "DEP-SALES", IsActive = true },
                new Department { Id = 2, Name = "Human Resources", Code = "DEP-HR", IsActive = true },
                new Department { Id = 3, Name = "Operations", Code = "DEP-OPS", IsActive = true },
                new Department { Id = 4, Name = "IT & Systems", Code = "DEP-IT", IsActive = true },
                new Department { Id = 5, Name = "Accounts & Finance", Code = "DEP-ACC", IsActive = true }
            );

            modelBuilder.Entity<Designation>().HasData(
                new Designation { Id = 1, Name = "Senior Sales Executive", Code = "DES-SSE", IsActive = true },
                new Designation { Id = 2, Name = "Field Officer", Code = "DES-FO", IsActive = true },
                new Designation { Id = 3, Name = "Area Manager", Code = "DES-AM", IsActive = true },
                new Designation { Id = 4, Name = "HR Manager", Code = "DES-HRM", IsActive = true },
                new Designation { Id = 5, Name = "Operations Coordinator", Code = "DES-OC", IsActive = true }
            );

            modelBuilder.Entity<RoleMaster>().HasData(
                new RoleMaster { Id = 1, Name = "Admin", Code = "ROLE-ADMIN", IsActive = true },
                new RoleMaster { Id = 2, Name = "Manager", Code = "ROLE-MGR", IsActive = true },
                new RoleMaster { Id = 3, Name = "Field Employee", Code = "ROLE-EMP", IsActive = true }
            );

            modelBuilder.Entity<Branch>().HasData(
                new Branch { Id = 1, Name = "Head Office", Code = "BR-HO", City = "Kolhapur", IsActive = true },
                new Branch { Id = 2, Name = "Regional Branch", Code = "BR-REG", City = "Gadhinglaj", IsActive = true },
                new Branch { Id = 3, Name = "North Branch", Code = "BR-NOR", City = "Nagpur", IsActive = true }
            );

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
        }
    }
}
