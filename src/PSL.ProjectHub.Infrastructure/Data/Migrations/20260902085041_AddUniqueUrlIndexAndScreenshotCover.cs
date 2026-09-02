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
            // 1. Varsa eski indeksi güvenle kaldır
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProjectLinks_ProjectId_Url' AND object_id = OBJECT_ID('ProjectLinks'))
                BEGIN
                    DROP INDEX IX_ProjectLinks_ProjectId_Url ON ProjectLinks;
                END
            ");

            // 2. IsCover sütunu yoksa güvenle ekle
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE name = N'IsCover' AND object_id = OBJECT_ID(N'ProjectScreenshots'))
                BEGIN
                    ALTER TABLE ProjectScreenshots ADD IsCover bit NOT NULL CONSTRAINT DF_ProjectScreenshots_IsCover DEFAULT 0;
                END
            ");

            // 3. Mevcut mükerrer kayıtları temizle
            migrationBuilder.Sql(@"
                WITH DuplicateLinks AS (
                    SELECT Id,
                           ROW_NUMBER() OVER (PARTITION BY ProjectId, Url ORDER BY CreatedAt DESC, Id DESC) as rn
                    FROM ProjectLinks
                )
                DELETE FROM ProjectLinks
                WHERE Id IN (SELECT Id FROM DuplicateLinks WHERE rn > 1);
            ");

            // 4. Benzersiz (Unique) indeksi oluştur
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProjectLinks_ProjectId_Url' AND object_id = OBJECT_ID('ProjectLinks'))
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX IX_ProjectLinks_ProjectId_Url ON ProjectLinks(ProjectId, Url);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProjectLinks_ProjectId_Url' AND object_id = OBJECT_ID('ProjectLinks'))
                BEGIN
                    DROP INDEX IX_ProjectLinks_ProjectId_Url ON ProjectLinks;
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE name = N'IsCover' AND object_id = OBJECT_ID(N'ProjectScreenshots'))
                BEGIN
                    ALTER TABLE ProjectScreenshots DROP CONSTRAINT DF_ProjectScreenshots_IsCover;
                    ALTER TABLE ProjectScreenshots DROP COLUMN IsCover;
                END
            ");

            migrationBuilder.Sql(@"
                CREATE NONCLUSTERED INDEX IX_ProjectLinks_ProjectId_Url ON ProjectLinks(ProjectId, Url);
            ");
        }
    }
}
