using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSL.ProjectHub.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrganizationSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    OrganizationName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TeamName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    DirectorName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    DirectorTitle = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Tagline = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    AccentColor = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: false),
                    LogoFileName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrganizationSettings");
        }
    }
}
