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
    private readonly IConfiguration _configuration;

    public LeaguesController(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    /*
     * Return every league the current
     * authenticated user belongs to.
     */
    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult>
        GetMyLeagues()
    {
        var userId =
            GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var memberships =
            await _context.LeagueMembers
                .Where(member =>
                    member.UserId ==
                    userId.Value
                )
                .Include(member =>
                    member.League
                )
                    .ThenInclude(league =>
                        league.Members
                    )
                .OrderBy(member =>
                    member.League.Name
                )
                .Select(member => new
                {
                    League = new
                    {
                        member.League.Id,
                        member.League.Name,
                        member.League.InviteCode,
                        member.League.MaxTeams,

                        MemberCount =
                            member.League
                                .Members.Count
                    },

                    Team = new
                    {
                        member.Id,

                        Name =
                            member.TeamName,

                        member.IsCommissioner
                    }
                })
                .ToListAsync();

        return Ok(
            memberships
        );
    }

    /*
     * League members can view their league.
     *
     * The configured application admin may
     * also view any league so admin tools can
     * manage leagues without joining them.
     */
    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<ActionResult>
        GetLeague(
            int id)
    {
        var userId =
            GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var league =
            await _context.Leagues
                .Include(l =>
                    l.Members
                )
                .FirstOrDefaultAsync(l =>
                    l.Id == id
                );

        if (league == null)
        {
            return NotFound(
                "League not found."
            );
        }

        var isMember =
            league.Members.Any(member =>
                member.UserId ==
                userId.Value
            );

        var isAdmin =
            IsAppAdmin();

        if (
            !isMember &&
            !isAdmin
        )
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "You are not a member of this league."
            );
        }

        return Ok(
            league
        );
    }

    /*
     * Return the current user's fantasy team
     * inside one league.
     */
    [Authorize]
    [HttpGet("{id:int}/me")]
    public async Task<ActionResult>
        GetMyLeagueTeam(
            int id)
    {
        var userId =
            GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var member =
            await _context.LeagueMembers
                .Where(member =>
                    member.LeagueId ==
                        id &&
                    member.UserId ==
                        userId.Value
                )
                .Select(member =>
                    new
                    {
                        TeamId =
                            member.Id,

                        TeamName =
                            member.TeamName,

                        member
                            .IsCommissioner
                    }
                )
                .FirstOrDefaultAsync();

        if (member == null)
        {
            return NotFound(
                "You are not a member of this league."
            );
        }

        return Ok(
            member
        );
    }

    /*
     * Only league members can view
     * league rosters.
     */
    [Authorize]
    [HttpGet("{id:int}/rosters")]
    public async Task<ActionResult>
        GetRosters(
            int id)
    {
        var userId =
            GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var league =
            await _context.Leagues
                .Include(l =>
                    l.Members
                )
                .FirstOrDefaultAsync(l =>
                    l.Id == id
                );

        if (league == null)
        {
            return NotFound(
                "League not found."
            );
        }

        var isMember =
            league.Members.Any(member =>
                member.UserId ==
                userId.Value
            );

        if (!isMember)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "You are not a member of this league."
            );
        }

        var rosterPlayers =
            await _context.RosterPlayers
                .Where(r =>
                    r.LeagueMember
                        .LeagueId ==
                    id
                )
                .Include(r =>
                    r.Player
                )
                .Include(r =>
                    r.LeagueMember
                )
                .ToListAsync();

        var rosters =
            league.Members
                .OrderBy(member =>
                    member.Id
                )
                .Select(member =>
                    new
                    {
                        Team = new
                        {
                            member.Id,

                            Name =
                                member.TeamName,

                            member
                                .IsCommissioner
                        },

                        Players =
                            rosterPlayers
                                .Where(r =>
                                    r.LeagueMemberId ==
                                    member.Id
                                )
                                .Select(r =>
                                    new
                                    {
                                        r.Player.Id,
                                        r.Player.Name,
                                        r.Player.Country,
                                        r.Player
                                            .SeasonStartingRank,
                                        r.Player
                                            .FantasyPoints,
                                        r.Player
                                            .RecentFinish
                                    }
                                )
                    }
                );

        return Ok(
            rosters
        );
    }

    /*
     * Join an existing league by invite code.
     */
    [Authorize]
    [HttpPost("join")]
    public async Task<ActionResult>
        JoinLeague(
            JoinLeagueRequest request)
    {
        var userId =
            GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        if (
            string.IsNullOrWhiteSpace(
                request.InviteCode
            )
        )
        {
            return BadRequest(
                "Invite code is required."
            );
        }

        if (
            string.IsNullOrWhiteSpace(
                request.TeamName
            )
        )
        {
            return BadRequest(
                "Team name is required."
            );
        }

        var inviteCode =
            request.InviteCode
                .Trim()
                .ToUpperInvariant();

        var teamName =
            request.TeamName.Trim();

        var league =
            await _context.Leagues
                .Include(l =>
                    l.Members
                )
                .FirstOrDefaultAsync(l =>
                    l.InviteCode ==
                    inviteCode
                );

        if (league == null)
        {
            return NotFound(
                "No league was found with that invite code."
            );
        }

        if (
            league.Members.Count >=
            league.MaxTeams
        )
        {
            return BadRequest(
                "This league is full."
            );
        }

        var alreadyInLeague =
            league.Members.Any(member =>
                member.UserId ==
                userId.Value
            );

        if (alreadyInLeague)
        {
            return BadRequest(
                "You are already a member of this league."
            );
        }

        var teamNameExists =
            league.Members.Any(member =>
                string.Equals(
                    member.TeamName,
                    teamName,
                    StringComparison.OrdinalIgnoreCase
                )
            );

        if (teamNameExists)
        {
            return BadRequest(
                "That team name is already being used in this league."
            );
        }

        var member =
            new LeagueMember
            {
                TeamName =
                    teamName,

                LeagueId =
                    league.Id,

                UserId =
                    userId.Value,

                IsCommissioner =
                    false
            };

        _context.LeagueMembers
            .Add(
                member
            );

        await _context
            .SaveChangesAsync();

        return Ok(new
        {
            League = new
            {
                league.Id,
                league.Name,
                league.InviteCode,
                league.MaxTeams
            },

            Team = new
            {
                member.Id,

                Name =
                    member.TeamName,

                member.IsCommissioner
            }
        });
    }

    /*
     * Create a new league.
     *
     * The authenticated creator becomes
     * commissioner.
     */
    [Authorize]
    [HttpPost]
    public async Task<ActionResult>
        CreateLeague(
            CreateLeagueRequest request)
    {
        var userId =
            GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        if (
            string.IsNullOrWhiteSpace(
                request.LeagueName
            )
        )
        {
            return BadRequest(
                "League name is required."
            );
        }

        if (
            string.IsNullOrWhiteSpace(
                request.TeamName
            )
        )
        {
            return BadRequest(
                "Team name is required."
            );
        }

        /*
         * Keep league sizes inside
         * a reasonable supported range.
         */
        if (
            request.MaxTeams < 2 ||
            request.MaxTeams > 16
        )
        {
            return BadRequest(
                "League size must be between 2 and 16 teams."
            );
        }

        var league =
            new League
            {
                Name =
                    request.LeagueName
                        .Trim(),

                MaxTeams =
                    request.MaxTeams,

                InviteCode =
                    GenerateInviteCode()
            };

        league.Members.Add(
            new LeagueMember
            {
                TeamName =
                    request.TeamName
                        .Trim(),

                UserId =
                    userId.Value,

                IsCommissioner =
                    true
            }
        );

        _context.Leagues.Add(
            league
        );

        await _context
            .SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetLeague),

            new
            {
                id =
                    league.Id
            },

            league
        );
    }

    /*
     * Check whether the authenticated user
     * is the configured application admin.
     */
    private bool IsAppAdmin()
    {
        var userEmail =
            User.FindFirstValue(
                ClaimTypes.Email
            );

        var adminEmail =
            _configuration[
                "Admin:Email"
            ];

        if (
            string.IsNullOrWhiteSpace(
                userEmail
            ) ||
            string.IsNullOrWhiteSpace(
                adminEmail
            )
        )
        {
            return false;
        }

        return string.Equals(
            userEmail.Trim(),
            adminEmail.Trim(),
            StringComparison.OrdinalIgnoreCase
        );
    }

    /*
     * Read authenticated user ID
     * from the JWT.
     */
    private int? GetCurrentUserId()
    {
        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (
            !int.TryParse(
                userIdClaim,
                out var userId
            )
        )
        {
            return null;
        }

        return userId;
    }

    /*
     * Create an 8-character invite code.
     */
    private static string GenerateInviteCode()
    {
        return Guid.NewGuid()
            .ToString("N")
            .Substring(0, 8)
            .ToUpperInvariant();
    }
}

public class CreateLeagueRequest
{
    public string LeagueName
    {
        get;
        set;
    } = string.Empty;

    public string TeamName
    {
        get;
        set;
    } = string.Empty;

    public int MaxTeams
    {
        get;
        set;
    } = 8;
}

public class JoinLeagueRequest
{
    public string InviteCode
    {
        get;
        set;
    } = string.Empty;

    public string TeamName
    {
        get;
        set;
    } = string.Empty;
}