using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NavbharatAgroAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeMasterAndLookups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Route",
                table: "FieldVisits",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<int>(
                name: "EmployeeMasterId",
                table: "Employees",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Branches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Branches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Designations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Designations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RoleMasters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleMasters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeMasters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmployeeCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EmployeeId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MiddleName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FullName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Gender = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    MobileNumber = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    EmailAddress = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    ProfilePhoto = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DepartmentId = table.Column<int>(type: "integer", nullable: true),
                    DepartmentName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DesignationId = table.Column<int>(type: "integer", nullable: true),
                    DesignationName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RoleId = table.Column<int>(type: "integer", nullable: true),
                    RoleName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    BranchId = table.Column<int>(type: "integer", nullable: true),
                    BranchName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ReportingManager = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DateOfJoining = table.Column<DateOnly>(type: "date", nullable: true),
                    EmploymentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EmployeeStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CurrentAddress = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PermanentAddress = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    State = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Pincode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AadhaarNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PanNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DrivingLicenceNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EmergencyContactName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Relationship = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EmergencyContactNumber = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeMasters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeeMasters_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EmployeeMasters_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EmployeeMasters_Designations_DesignationId",
                        column: x => x.DesignationId,
                        principalTable: "Designations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EmployeeMasters_RoleMasters_RoleId",
                        column: x => x.RoleId,
                        principalTable: "RoleMasters",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Branches",
                columns: new[] { "Id", "City", "Code", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "Kolhapur", "BR-HO", true, "Head Office" },
                    { 2, "Gadhinglaj", "BR-REG", true, "Regional Branch" },
                    { 3, "Nagpur", "BR-NOR", true, "North Branch" }
                });

            migrationBuilder.InsertData(
                table: "Departments",
                columns: new[] { "Id", "Code", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "DEP-SALES", true, "Sales" },
                    { 2, "DEP-HR", true, "Human Resources" },
                    { 3, "DEP-OPS", true, "Operations" },
                    { 4, "DEP-IT", true, "IT & Systems" },
                    { 5, "DEP-ACC", true, "Accounts & Finance" }
                });

            migrationBuilder.InsertData(
                table: "Designations",
                columns: new[] { "Id", "Code", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "DES-SSE", true, "Senior Sales Executive" },
                    { 2, "DES-FO", true, "Field Officer" },
                    { 3, "DES-AM", true, "Area Manager" },
                    { 4, "DES-HRM", true, "HR Manager" },
                    { 5, "DES-OC", true, "Operations Coordinator" }
                });

            migrationBuilder.InsertData(
                table: "RoleMasters",
                columns: new[] { "Id", "Code", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "ROLE-ADMIN", true, "Admin" },
                    { 2, "ROLE-MGR", true, "Manager" },
                    { 3, "ROLE-EMP", true, "Field Employee" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_EmployeeMasterId",
                table: "Employees",
                column: "EmployeeMasterId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeMasters_BranchId",
                table: "EmployeeMasters",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeMasters_DepartmentId",
                table: "EmployeeMasters",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeMasters_DesignationId",
                table: "EmployeeMasters",
                column: "DesignationId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeMasters_EmailAddress",
                table: "EmployeeMasters",
                column: "EmailAddress");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeMasters_EmployeeCode",
                table: "EmployeeMasters",
                column: "EmployeeCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeMasters_EmployeeId",
                table: "EmployeeMasters",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeMasters_RoleId",
                table: "EmployeeMasters",
                column: "RoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_EmployeeMasters_EmployeeMasterId",
                table: "Employees",
                column: "EmployeeMasterId",
                principalTable: "EmployeeMasters",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_EmployeeMasters_EmployeeMasterId",
                table: "Employees");

            migrationBuilder.DropTable(
                name: "EmployeeMasters");

            migrationBuilder.DropTable(
                name: "Branches");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "Designations");

            migrationBuilder.DropTable(
                name: "RoleMasters");

            migrationBuilder.DropIndex(
                name: "IX_Employees_EmployeeMasterId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmployeeMasterId",
                table: "Employees");

            migrationBuilder.AlterColumn<string>(
                name: "Route",
                table: "FieldVisits",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);
        }
    }
}
