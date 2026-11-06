using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Api.Controllers;

/// <summary>
/// Yazılım ekibi üyeleri ve projelere atamaları. Bir projede lider işaretlenen üye,
/// projenin "Proje Sorumlusu" alanına da yazılır.
/// </summary>
[ApiController]
[Authorize]
public class TeamController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _audit;

    public TeamController(AppDbContext context, IAuditLogService audit)
    {
        _context = context;
        _audit = audit;
    }

    private Task LogAsync(string entity, string id, string action, string details, CancellationToken ct) =>
        _audit.LogAsync(entity, id, action,
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value, User.Identity?.Name, details, ct);

    [HttpGet("api/team")]
    public async Task<ActionResult<List<TeamMemberDto>>> GetTeam(CancellationToken ct)
    {
        var members = await _context.TeamMembers
            .Include(t => t.Projects).ThenInclude(p => p.Project)
            .AsNoTracking()
            .OrderByDescending(t => t.IsActive).ThenBy(t => t.FullName)
            .ToListAsync(ct);

        return Ok(members.Select(t => new TeamMemberDto
        {
            Id = t.Id,
            FullName = t.FullName,
            Title = t.Title,
            Email = t.Email,
            IsActive = t.IsActive,
            Projects = t.Projects
                .Where(p => p.Project != null && !p.Project.IsArchived)
                .OrderByDescending(p => p.IsLead).ThenBy(p => p.Project.Name)
                .Select(p => new TeamMemberProjectDto
                {
                    ProjectId = p.ProjectId,
                    ProjectName = p.Project.Name,
                    ProjectSlug = p.Project.Slug,
                    Role = p.Role,
                    IsLead = p.IsLead
                }).ToList()
        }).ToList());
    }

    [HttpPost("api/team")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<TeamMemberDto>> CreateMember([FromBody] UpsertTeamMemberRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var member = new TeamMember();
        Apply(member, request);
        _context.TeamMembers.Add(member);
        await _context.SaveChangesAsync(ct);
        await LogAsync("TeamMember", member.Id.ToString(), "Create", $"Ekip üyesi eklendi: {member.FullName}", ct);
        return Ok(new TeamMemberDto { Id = member.Id, FullName = member.FullName, Title = member.Title, Email = member.Email, IsActive = member.IsActive });
    }

    [HttpPut("api/team/{id:guid}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<TeamMemberDto>> UpdateMember(Guid id, [FromBody] UpsertTeamMemberRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var member = await _context.TeamMembers.FindAsync([id], ct);
        if (member == null) return NotFound();
        var oldName = member.FullName;
        Apply(member, request);

        // İsim değiştiyse lideri olduğu projelerin sorumlu alanı da güncellenir
        if (oldName != member.FullName)
        {
            var ledProjectIds = await _context.ProjectMembers
                .Where(pm => pm.TeamMemberId == id && pm.IsLead).Select(pm => pm.ProjectId).ToListAsync(ct);
            var projects = await _context.Projects.Where(p => ledProjectIds.Contains(p.Id)).ToListAsync(ct);
            foreach (var p in projects) p.OwnerName = member.FullName;
        }

        await _context.SaveChangesAsync(ct);
        await LogAsync("TeamMember", id.ToString(), "Update", $"Ekip üyesi güncellendi: {member.FullName}", ct);
        return Ok(new TeamMemberDto { Id = member.Id, FullName = member.FullName, Title = member.Title, Email = member.Email, IsActive = member.IsActive });
    }

    [HttpDelete("api/team/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteMember(Guid id, CancellationToken ct)
    {
        var member = await _context.TeamMembers.FindAsync([id], ct);
        if (member == null) return NotFound();

        var ledProjectIds = await _context.ProjectMembers.IgnoreQueryFilters()
            .Where(pm => pm.TeamMemberId == id && pm.IsLead).Select(pm => pm.ProjectId).ToListAsync(ct);
        var projects = await _context.Projects.IgnoreQueryFilters()
            .Where(p => ledProjectIds.Contains(p.Id) && p.OwnerName == member.FullName).ToListAsync(ct);
        foreach (var p in projects) p.OwnerName = null;

        _context.TeamMembers.Remove(member);
        await _context.SaveChangesAsync(ct);
        await LogAsync("TeamMember", id.ToString(), "Delete", $"Ekip üyesi silindi: {member.FullName}", ct);
        return NoContent();
    }

    [HttpGet("api/projects/{projectId:guid}/team")]
    public async Task<ActionResult<List<ProjectMemberDto>>> GetProjectTeam(Guid projectId, CancellationToken ct)
    {
        var members = await _context.ProjectMembers
            .Where(pm => pm.ProjectId == projectId)
            .Include(pm => pm.TeamMember)
            .AsNoTracking()
            .OrderByDescending(pm => pm.IsLead).ThenBy(pm => pm.TeamMember.FullName)
            .ToListAsync(ct);
        return Ok(members.Select(ToDto).ToList());
    }

    [HttpPost("api/projects/{projectId:guid}/team")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<ProjectMemberDto>> AssignMember(
        Guid projectId, [FromBody] AssignProjectMemberRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct);
        if (project == null) return NotFound(new { message = "Proje bulunamadı." });

        TeamMember? member;
        if (request.TeamMemberId is Guid memberId)
        {
            member = await _context.TeamMembers.FindAsync([memberId], ct);
            if (member == null) return NotFound(new { message = "Ekip üyesi bulunamadı." });
        }
        else if (!string.IsNullOrWhiteSpace(request.NewMemberName))
        {
            var name = request.NewMemberName.Trim();
            // Aynı isimde kayıt varsa tekrar oluşturmak yerine onu kullan
            member = await _context.TeamMembers.FirstOrDefaultAsync(t => t.FullName == name, ct);
            if (member == null)
            {
                member = new TeamMember { FullName = name, Title = string.IsNullOrWhiteSpace(request.NewMemberTitle) ? null : request.NewMemberTitle.Trim() };
                _context.TeamMembers.Add(member);
            }
        }
        else
        {
            return BadRequest(new { message = "Bir ekip üyesi seçin ya da yeni üyenin adını yazın." });
        }

        var existing = await _context.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.TeamMemberId == member.Id, ct);
        var assignment = existing ?? new ProjectMember { ProjectId = projectId, TeamMemberId = member.Id };
        assignment.Role = request.Role.Trim();
        assignment.IsLead = request.IsLead;
        if (existing == null) _context.ProjectMembers.Add(assignment);

        await ApplyLeadAsync(project, member, request.IsLead, ct);
        await _context.SaveChangesAsync(ct);
        await LogAsync("ProjectMember", $"{projectId}/{member.Id}", existing == null ? "Create" : "Update",
            $"'{project.Name}' projesine {member.FullName} ({assignment.Role}{(assignment.IsLead ? ", sorumlu" : "")}) atandı", ct);

        assignment.TeamMember = member;
        return Ok(ToDto(assignment));
    }

    [HttpDelete("api/projects/{projectId:guid}/team/{memberId:guid}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> RemoveMember(Guid projectId, Guid memberId, CancellationToken ct)
    {
        var assignment = await _context.ProjectMembers
            .Include(pm => pm.TeamMember).Include(pm => pm.Project)
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.TeamMemberId == memberId, ct);
        if (assignment == null) return NotFound();

        if (assignment.IsLead && assignment.Project.OwnerName == assignment.TeamMember.FullName)
            assignment.Project.OwnerName = null;

        _context.ProjectMembers.Remove(assignment);
        await _context.SaveChangesAsync(ct);
        await LogAsync("ProjectMember", $"{projectId}/{memberId}", "Delete",
            $"'{assignment.Project.Name}' projesinden {assignment.TeamMember.FullName} çıkarıldı", ct);
        return NoContent();
    }

    /// <summary>Projede tek lider olmasını sağlar ve proje sorumlusu alanını senkron tutar.</summary>
    private async Task ApplyLeadAsync(Project project, TeamMember member, bool isLead, CancellationToken ct)
    {
        if (isLead)
        {
            var others = await _context.ProjectMembers
                .Where(pm => pm.ProjectId == project.Id && pm.TeamMemberId != member.Id && pm.IsLead)
                .ToListAsync(ct);
            foreach (var o in others) o.IsLead = false;
            project.OwnerName = member.FullName;
        }
        else if (project.OwnerName == member.FullName)
        {
            project.OwnerName = null;
        }
        project.UpdatedAt = DateTime.UtcNow;
    }

    private static void Apply(TeamMember member, UpsertTeamMemberRequest request)
    {
        member.FullName = request.FullName.Trim();
        member.Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim();
        member.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        member.IsActive = request.IsActive;
    }

    private static ProjectMemberDto ToDto(ProjectMember pm) => new()
    {
        TeamMemberId = pm.TeamMemberId,
        FullName = pm.TeamMember.FullName,
        Title = pm.TeamMember.Title,
        Role = pm.Role,
        IsLead = pm.IsLead
    };
}
