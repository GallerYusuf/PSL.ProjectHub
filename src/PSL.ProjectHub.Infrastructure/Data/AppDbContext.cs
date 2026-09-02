using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Identity;

namespace PSL.ProjectHub.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectComponent> ProjectComponents => Set<ProjectComponent>();
    public DbSet<ProjectLink> ProjectLinks => Set<ProjectLink>();
    public DbSet<ProjectScreenshot> ProjectScreenshots => Set<ProjectScreenshot>();
    public DbSet<Technology> Technologies => Set<Technology>();
    public DbSet<ProjectTechnology> ProjectTechnologies => Set<ProjectTechnology>();
    public DbSet<ProjectIntegration> ProjectIntegrations => Set<ProjectIntegration>();
    public DbSet<ProjectRelease> ProjectReleases => Set<ProjectRelease>();
    public DbSet<ProjectNote> ProjectNotes => Set<ProjectNote>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Project configuration
        builder.Entity<Project>(b =>
        {
            b.HasKey(p => p.Id);
            b.Property(p => p.Name).HasMaxLength(200).IsRequired();
            b.Property(p => p.Slug).HasMaxLength(200).IsRequired();
            b.HasIndex(p => p.Slug).IsUnique();
            b.Property(p => p.ShortDescription).HasMaxLength(500).IsRequired();
            b.Property(p => p.Category).HasMaxLength(100).IsRequired();
            b.Property(p => p.Status).HasConversion<string>().HasMaxLength(50);
            b.Property(p => p.OwnerName).HasMaxLength(150);
            b.Property(p => p.Department).HasMaxLength(150);
            b.Property(p => p.TargetUsers).HasMaxLength(250);
            b.Property(p => p.CurrentVersion).HasMaxLength(50);

            // Soft-delete global query filter
            b.HasQueryFilter(p => !p.IsArchived);

            b.HasMany(p => p.Components).WithOne(c => c.Project).HasForeignKey(c => c.ProjectId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(p => p.Links).WithOne(l => l.Project).HasForeignKey(l => l.ProjectId).OnDelete(DeleteBehavior.Restrict);
            b.HasMany(p => p.Screenshots).WithOne(s => s.Project).HasForeignKey(s => s.ProjectId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(p => p.Integrations).WithOne(i => i.Project).HasForeignKey(i => i.ProjectId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(p => p.Releases).WithOne(r => r.Project).HasForeignKey(r => r.ProjectId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(p => p.Notes).WithOne(n => n.Project).HasForeignKey(n => n.ProjectId).OnDelete(DeleteBehavior.Cascade);
        });

        // ProjectComponent
        builder.Entity<ProjectComponent>(b =>
        {
            b.HasKey(c => c.Id);
            b.Property(c => c.Name).HasMaxLength(150).IsRequired();
            b.Property(c => c.ComponentType).HasConversion<string>().HasMaxLength(50);
            b.Property(c => c.Description).HasMaxLength(500);
            b.Property(c => c.Environment).HasMaxLength(50);
            b.HasQueryFilter(c => !c.Project.IsArchived);
        });

        // ProjectLink
        builder.Entity<ProjectLink>(b =>
        {
            b.HasKey(l => l.Id);
            b.Property(l => l.Label).HasMaxLength(150).IsRequired();
            b.Property(l => l.Url).HasMaxLength(1000).IsRequired();
            b.Property(l => l.LinkType).HasConversion<string>().HasMaxLength(50);
            b.Property(l => l.Environment).HasConversion<string>().HasMaxLength(50);
            b.HasQueryFilter(l => !l.Project.IsArchived);

            // Unique index per project & url to prevent accidental duplicate additions
            b.HasIndex(l => new { l.ProjectId, l.Url });

            b.HasOne(l => l.Project)
             .WithMany(p => p.Links)
             .HasForeignKey(l => l.ProjectId)
             .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(l => l.ProjectComponent)
             .WithMany(c => c.Links)
             .HasForeignKey(l => l.ProjectComponentId)
             .OnDelete(DeleteBehavior.NoAction);
        });

        // Technology & Many-to-Many
        builder.Entity<Technology>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.Name).HasMaxLength(100).IsRequired();
            b.Property(t => t.Category).HasConversion<string>().HasMaxLength(50);
            b.HasIndex(t => t.Name).IsUnique();
        });

        builder.Entity<ProjectTechnology>(b =>
        {
            b.HasKey(pt => new { pt.ProjectId, pt.TechnologyId });
            b.HasOne(pt => pt.Project).WithMany(p => p.ProjectTechnologies).HasForeignKey(pt => pt.ProjectId);
            b.HasOne(pt => pt.Technology).WithMany(t => t.ProjectTechnologies).HasForeignKey(pt => pt.TechnologyId);
            b.HasQueryFilter(pt => !pt.Project.IsArchived);
        });

        // ProjectIntegration
        builder.Entity<ProjectIntegration>(b =>
        {
            b.HasKey(i => i.Id);
            b.Property(i => i.Name).HasMaxLength(150).IsRequired();
            b.Property(i => i.IntegrationType).HasMaxLength(100).IsRequired();
            b.Property(i => i.Description).HasMaxLength(500);
            b.HasQueryFilter(i => !i.Project.IsArchived);
        });

        // ProjectRelease
        builder.Entity<ProjectRelease>(b =>
        {
            b.HasKey(r => r.Id);
            b.Property(r => r.Version).HasMaxLength(50).IsRequired();
            b.Property(r => r.Title).HasMaxLength(200).IsRequired();
            b.Property(r => r.Description).HasMaxLength(1000);
            b.Property(r => r.Environment).HasMaxLength(50);
            b.HasQueryFilter(r => !r.Project.IsArchived);
        });

        // ProjectNote
        builder.Entity<ProjectNote>(b =>
        {
            b.HasKey(n => n.Id);
            b.Property(n => n.Title).HasMaxLength(200).IsRequired();
            b.Property(n => n.NoteType).HasConversion<string>().HasMaxLength(50);
            b.HasQueryFilter(n => !n.Project.IsArchived);
        });

        // ProjectScreenshot
        builder.Entity<ProjectScreenshot>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.FileName).HasMaxLength(255).IsRequired();
            b.Property(s => s.FilePath).HasMaxLength(1000).IsRequired();
            b.Property(s => s.Caption).HasMaxLength(300);
            b.HasQueryFilter(s => !s.Project.IsArchived);
        });
    }
}
