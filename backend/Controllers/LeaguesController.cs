using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
    [Authorize]
    [HttpGet("mine")]
        public async Task<ActionResult> GetMyLeagues()
    {
    var userId = GetCurrentUserId();

    if (userId == null)
    {
        return Unauthorized();
    }

    var memberships = await _context.LeagueMembers
        .Where(member =>
            member.UserId == userId.Value
        )
        .Include(member => member.League)
            .ThenInclude(league => league.Members)
        .OrderBy(member => member.League.Name)
        .Select(member => new
        {
            League = new
            {
                member.League.Id,
                member.League.Name,
                member.League.InviteCode,
                member.League.MaxTeams,
                MemberCount =
                    member.League.Members.Count
            },

            Team = new
            {
                member.Id,
                Name = member.TeamName,
                member.IsCommissioner
            }
        })
        .ToListAsync();

    return Ok(memberships);
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
    [Authorize]
    [HttpGet("{id:int}/me")]
    public async Task<ActionResult> GetMyLeagueTeam(int id)
    {
    var userId = GetCurrentUserId();

    if (userId == null)
    {
        return Unauthorized();
    }

    var member = await _context.LeagueMembers
        .Where(member =>
            member.LeagueId == id &&
            member.UserId == userId.Value
        )
        .Select(member => new
        {
            TeamId = member.Id,
            TeamName = member.TeamName,
            member.IsCommissioner
        })
        .FirstOrDefaultAsync();

    if (member == null)
    {
        return NotFound(
            "You are not a member of this league."
        );
    }

    return Ok(member);
    }
    [HttpGet("{id:int}/rosters")]
    public async Task<ActionResult> GetRosters(int id)
    {
        var league = await _context.Leagues
            .Include(l => l.Members)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (league == null)
        {
            return NotFound("League not found.");
        }

        var rosterPlayers = await _context.RosterPlayers
            .Where(r => r.LeagueMember.LeagueId == id)
            .Include(r => r.Player)
            .Include(r => r.LeagueMember)
            .ToListAsync();

        var rosters = league.Members
            .OrderBy(member => member.Id)
            .Select(member => new
            {
                Team = new
                {
                    member.Id,
                    Name = member.TeamName,
                    member.IsCommissioner
                },

                Players = rosterPlayers
                    .Where(r => r.LeagueMemberId == member.Id)
                    .Select(r => new
                    {
                        r.Player.Id,
                        r.Player.Name,
                        r.Player.Country,
                        r.Player.SeasonStartingRank,
                        r.Player.FantasyPoints,
                        r.Player.RecentFinish
                    })
            });

        return Ok(rosters);
    }

    [Authorize]
    [HttpPost("join")]
    public async Task<ActionResult<League>> JoinLeague(
        JoinLeagueRequest request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.InviteCode))
        {
            return BadRequest("Invite code is required.");
        }

        if (string.IsNullOrWhiteSpace(request.TeamName))
        {
            return BadRequest("Team name is required.");
        }

        var inviteCode =
            request.InviteCode.Trim().ToUpper();

        var league = await _context.Leagues
            .Include(l => l.Members)
            .FirstOrDefaultAsync(l =>
                l.InviteCode == inviteCode
            );

        if (league == null)
        {
            return NotFound(
                "No league was found with that invite code."
            );
        }

        if (league.Members.Count >= league.MaxTeams)
        {
            return BadRequest(
                "This league is full."
            );
        }

        var alreadyInLeague =
            league.Members.Any(member =>
                member.UserId == userId.Value
            );

        if (alreadyInLeague)
        {
            return BadRequest(
                "You are already a member of this league."
            );
        }

        var teamNameExists =
            league.Members.Any(member =>
                member.TeamName.ToLower() ==
                request.TeamName
                    .Trim()
                    .ToLower()
            );

        if (teamNameExists)
        {
            return BadRequest(
                "That team name is already being used in this league."
            );
        }

        var member = new LeagueMember
        {
            TeamName = request.TeamName.Trim(),
            LeagueId = league.Id,
            UserId = userId.Value,
            IsCommissioner = false
        };

        _context.LeagueMembers.Add(member);

        await _context.SaveChangesAsync();

        league.Members.Add(member);

        return Ok(league);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<League>> CreateLeague(
        CreateLeagueRequest request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.LeagueName))
        {
            return BadRequest(
                "League name is required."
            );
        }

        if (string.IsNullOrWhiteSpace(request.TeamName))
        {
            return BadRequest(
                "Team name is required."
            );
        }

        var league = new League
        {
            Name = request.LeagueName.Trim(),
            MaxTeams = request.MaxTeams,
            InviteCode = GenerateInviteCode()
        };

        league.Members.Add(
            new LeagueMember
            {
                TeamName = request.TeamName.Trim(),
                UserId = userId.Value,
                IsCommissioner = true
            }
        );

        _context.Leagues.Add(league);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetLeague),
            new { id = league.Id },
            league
        );
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!int.TryParse(
                userIdClaim,
                out var userId))
        {
            return null;
        }

        return userId;
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
    public string LeagueName { get; set; } =
        string.Empty;

    public string TeamName { get; set; } =
        string.Empty;

    public int MaxTeams { get; set; } = 8;
}

public class JoinLeagueRequest
{
    public string InviteCode { get; set; } =
        string.Empty;

    public string TeamName { get; set; } =
        string.Empty;
}