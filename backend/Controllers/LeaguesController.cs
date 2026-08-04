using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaguesController : ControllerBase
{
    private readonly AppDbContext _context;

    public LeaguesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<League>> GetLeague(int id)
    {
        var league = await _context.Leagues
            .Include(l => l.Members)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (league == null)
        {
            return NotFound();
        }

        return Ok(league);
    }

    [HttpPost("join")]
    public async Task<ActionResult<League>> JoinLeague(JoinLeagueRequest request)
    {
    if (string.IsNullOrWhiteSpace(request.InviteCode))
    {
        return BadRequest("Invite code is required.");
    }

    if (string.IsNullOrWhiteSpace(request.TeamName))
    {
        return BadRequest("Team name is required.");
    }

    var inviteCode = request.InviteCode.Trim().ToUpper();

    var league = await _context.Leagues
        .Include(l => l.Members)
        .FirstOrDefaultAsync(l => l.InviteCode == inviteCode);

    if (league == null)
    {
        return NotFound("No league was found with that invite code.");
    }

    if (league.Members.Count >= league.MaxTeams)
    {
        return BadRequest("This league is full.");
    }

    var teamNameExists = league.Members.Any(member =>
        member.TeamName.ToLower() == request.TeamName.Trim().ToLower()
    );

    if (teamNameExists)
    {
        return BadRequest("That team name is already being used in this league.");
    }

    var member = new LeagueMember
    {
        TeamName = request.TeamName.Trim(),
        LeagueId = league.Id,
        IsCommissioner = false
    };

    _context.LeagueMembers.Add(member);

    await _context.SaveChangesAsync();

    league.Members.Add(member);

    return Ok(league);
    }
    [HttpPost]
    public async Task<ActionResult<League>> CreateLeague(CreateLeagueRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.LeagueName))
        {
            return BadRequest("League name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.TeamName))
        {
            return BadRequest("Team name is required.");
        }

        var league = new League
        {
            Name = request.LeagueName.Trim(),
            MaxTeams = request.MaxTeams,
            InviteCode = GenerateInviteCode()
        };

        league.Members.Add(new LeagueMember
        {
            TeamName = request.TeamName.Trim(),
            IsCommissioner = true
        });

        _context.Leagues.Add(league);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetLeague),
            new { id = league.Id },
            league
        );
    }

    private static string GenerateInviteCode()
    {
        return Guid.NewGuid()
            .ToString("N")
            .Substring(0, 8)
            .ToUpper();
    }
}

public class CreateLeagueRequest
{
    public string LeagueName { get; set; } = string.Empty;

    public string TeamName { get; set; } = string.Empty;

    public int MaxTeams { get; set; } = 8;
}

public class JoinLeagueRequest
{
    public string InviteCode { get; set; } = string.Empty;

    public string TeamName { get; set; } = string.Empty;
}