using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NavbharatAgroAPI.Migrations
{
    /// <inheritdoc />
    public partial class RenameEmployeeToSalesEmployeeAndSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FieldVisits_Employees_EmployeeId",
                table: "FieldVisits");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderBookings_Employees_EmployeeId",
                table: "OrderBookings");

            migrationBuilder.DropForeignKey(
                name: "FK_RouteMasters_Employees_AssignedEmployeeId",
                table: "RouteMasters");

            // RENAME TABLE safely without dropping or losing any data
            migrationBuilder.RenameTable(
                name: "Employees",
                newName: "SalesEmployees");

            migrationBuilder.RenameIndex(
                name: "IX_Employees_EmployeeCode",
                newName: "IX_SalesEmployees_EmployeeCode",
                table: "SalesEmployees");

            migrationBuilder.RenameIndex(
                name: "IX_Employees_MobileNumber",
                newName: "IX_SalesEmployees_MobileNumber",
                table: "SalesEmployees");

            migrationBuilder.RenameIndex(
                name: "IX_Employees_EmployeeMasterId",
                newName: "IX_SalesEmployees_EmployeeMasterId",
                table: "SalesEmployees");

            migrationBuilder.AddForeignKey(
                name: "FK_SalesEmployees_EmployeeMasters_EmployeeMasterId",
                table: "SalesEmployees",
                column: "EmployeeMasterId",
                principalTable: "EmployeeMasters",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_FieldVisits_SalesEmployees_EmployeeId",
                table: "FieldVisits",
                column: "EmployeeId",
                principalTable: "SalesEmployees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderBookings_SalesEmployees_EmployeeId",
                table: "OrderBookings",
                column: "EmployeeId",
                principalTable: "SalesEmployees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RouteMasters_SalesEmployees_AssignedEmployeeId",
                table: "RouteMasters",
                column: "AssignedEmployeeId",
                principalTable: "SalesEmployees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FieldVisits_SalesEmployees_EmployeeId",
                table: "FieldVisits");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderBookings_SalesEmployees_EmployeeId",
                table: "OrderBookings");

            migrationBuilder.DropForeignKey(
                name: "FK_RouteMasters_SalesEmployees_AssignedEmployeeId",
                table: "RouteMasters");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesEmployees_EmployeeMasters_EmployeeMasterId",
                table: "SalesEmployees");

            migrationBuilder.RenameTable(
                name: "SalesEmployees",
                newName: "Employees");

            migrationBuilder.RenameIndex(
                name: "IX_SalesEmployees_EmployeeCode",
                newName: "IX_Employees_EmployeeCode",
                table: "Employees");

            migrationBuilder.RenameIndex(
                name: "IX_SalesEmployees_MobileNumber",
                newName: "IX_Employees_MobileNumber",
                table: "Employees");

            migrationBuilder.RenameIndex(
                name: "IX_SalesEmployees_EmployeeMasterId",
                newName: "IX_Employees_EmployeeMasterId",
                table: "Employees");

            migrationBuilder.AddForeignKey(
                name: "FK_FieldVisits_Employees_EmployeeId",
                table: "FieldVisits",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderBookings_Employees_EmployeeId",
                table: "OrderBookings",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RouteMasters_Employees_AssignedEmployeeId",
                table: "RouteMasters",
                column: "AssignedEmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
