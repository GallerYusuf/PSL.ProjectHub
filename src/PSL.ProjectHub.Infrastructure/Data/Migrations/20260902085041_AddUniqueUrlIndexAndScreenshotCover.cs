using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PSL.ProjectHub.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueUrlIndexAndScreenshotCover : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ProjectLinks_ProjectId_Url",
                table: "ProjectLinks");

            migrationBuilder.AddColumn<bool>(
                name: "IsCover",
                table: "ProjectScreenshots",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // Mevcut veritabanında mükerrer (ProjectId, Url) kayıtları varsa, en yeni kaydı koruyarak fazlalıkları güvenle temizle
            migrationBuilder.Sql(@"
                WITH DuplicateLinks AS (
                    SELECT Id,
                           ROW_NUMBER() OVER (PARTITION BY ProjectId, Url ORDER BY CreatedAt DESC, Id DESC) as rn
                    FROM ProjectLinks
                )
                DELETE FROM ProjectLinks
                WHERE Id IN (SELECT Id FROM DuplicateLinks WHERE rn > 1);
            ");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectLinks_ProjectId_Url",
                table: "ProjectLinks",
                columns: new[] { "ProjectId", "Url" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ProjectLinks_ProjectId_Url",
                table: "ProjectLinks");

            migrationBuilder.DropColumn(
                name: "IsCover",
                table: "ProjectScreenshots");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectLinks_ProjectId_Url",
                table: "ProjectLinks",
                columns: new[] { "ProjectId", "Url" });
        }
    }
}
