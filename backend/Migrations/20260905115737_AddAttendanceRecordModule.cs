using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace NavbharatAgroAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendanceRecordModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AttendanceRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmployeeId = table.Column<int>(type: "integer", nullable: false),
                    AttendanceDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PunchInTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PunchInLatitude = table.Column<double>(type: "double precision", nullable: true),
                    PunchInLongitude = table.Column<double>(type: "double precision", nullable: true),
                    PunchInAddress = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    PunchInAccuracy = table.Column<double>(type: "double precision", nullable: true),
                    PunchInDistance = table.Column<double>(type: "double precision", nullable: true),
                    PunchInPhotoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PunchOutTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PunchOutLatitude = table.Column<double>(type: "double precision", nullable: true),
                    PunchOutLongitude = table.Column<double>(type: "double precision", nullable: true),
                    PunchOutAddress = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    PunchOutAccuracy = table.Column<double>(type: "double precision", nullable: true),
                    PunchOutDistance = table.Column<double>(type: "double precision", nullable: true),
                    PunchOutPhotoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttendanceRecords_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_EmployeeId_AttendanceDate",
                table: "AttendanceRecords",
                columns: new[] { "EmployeeId", "AttendanceDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AttendanceRecords");
        }
    }
}
