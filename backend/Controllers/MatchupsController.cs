using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchupsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public MatchupsController(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    /*
     * Manually create a matchup.
     * Application admin only.
     */
    [Authorize]
    [HttpPost]
    public async Task<ActionResult> CreateMatchup(
        CreateMatchupRequest request)
    {
        if (!IsAppAdmin())
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Admin access required."
            );
        }

        var league = await _context.Leagues
            .Include(l => l.Members)
            .FirstOrDefaultAsync(l =>
                l.Id == request.LeagueId
            );

        if (league == null)
        {
            return NotFound(
                "League not found."
            );
        }

        var regionalEvent =
            await _context.RegionalEvents
                .FirstOrDefaultAsync(e =>
                    e.Id ==
                    request.RegionalEventId
                );

        if (regionalEvent == null)
        {
            return NotFound(
                "Regional event not found."
            );
        }

        var teamOne =
            await _context.LeagueMembers
                .FirstOrDefaultAsync(m =>
                    m.Id ==
                        request.TeamOneId &&
                    m.LeagueId ==
                        request.LeagueId
                );

        var teamTwo =
            await _context.LeagueMembers
                .FirstOrDefaultAsync(m =>
                    m.Id ==
                        request.TeamTwoId &&
                    m.LeagueId ==
                        request.LeagueId
                );

        if (
            teamOne == null ||
            teamTwo == null
        )
        {
            return BadRequest(
                "Both teams must belong to this league."
            );
        }

        if (
            teamOne.Id ==
            teamTwo.Id
        )
        {
            return BadRequest(
                "A team cannot play against itself."
            );
        }

        var duplicateExists =
            await _context.Matchups
                .AnyAsync(m =>
                    m.LeagueId ==
                        request.LeagueId &&
                    m.RegionalEventId ==
                        request.RegionalEventId &&
                    (
                        (
                            m.TeamOneId ==
                                request.TeamOneId &&
                            m.TeamTwoId ==
                                request.TeamTwoId
                        )
                        ||
                        (
                            m.TeamOneId ==
                                request.TeamTwoId &&
                            m.TeamTwoId ==
                                request.TeamOneId
                        )
                    )
                );

        if (duplicateExists)
        {
            return BadRequest(
                "This matchup already exists for this Regional."
            );
        }

        var matchup =
            new Matchup
            {
                LeagueId =
                    request.LeagueId,

                RegionalEventId =
                    request.RegionalEventId,

                TeamOneId =
                    request.TeamOneId,

                TeamTwoId =
                    request.TeamTwoId
            };

        _context.Matchups.Add(
            matchup
        );

        await _context.SaveChangesAsync();

        return Ok(new
        {
            matchup.Id,
            matchup.LeagueId,
            matchup.RegionalEventId,
            matchup.TeamOneId,
            matchup.TeamTwoId
        });
    }

    /*
     * Get matchups for one league.
     *
     * IMPORTANT:
     *
     * Final matchups with NO submitted lineup
     * from either team are ignored.
     *
     * This prevents accidental/test Regionals
     * from creating 0-0 ties in standings.
     */
    [HttpGet("league/{leagueId:int}")]
    public async Task<ActionResult> GetLeagueMatchups(
        int leagueId)
    {
        var matchups =
            await _context.Matchups
                .Where(m =>
                    m.LeagueId ==
                    leagueId
                )
                .Include(m =>
                    m.TeamOne
                )
                .Include(m =>
                    m.TeamTwo
                )
                .Include(m =>
                    m.RegionalEvent
                )
                .OrderBy(m =>
                    m.RegionalEvent
                        .SeasonWeek
                )
                .ToListAsync();

        var response =
            new List<object>();

        foreach (
            var matchup in
            matchups
        )
        {
            /*
             * Upcoming and Live matchups
             * should always be displayed.
             *
             * For Final events, at least one
             * team must have submitted a lineup
             * for the matchup to count/display.
             */
            if (
                matchup.RegionalEvent.Status ==
                "Final"
            )
            {
                var hasSubmittedLineup =
                    await _context
                        .RegionalLineupEntries
                        .AnyAsync(entry =>
                            entry.RegionalEventId ==
                                matchup.RegionalEventId &&
                            (
                                entry.LeagueMemberId ==
                                    matchup.TeamOneId ||
                                entry.LeagueMemberId ==
                                    matchup.TeamTwoId
                            )
                        );

                if (!hasSubmittedLineup)
                {
                    continue;
                }
            }

            var teamOneScore =
                await CalculateTeamScore(
                    matchup.TeamOneId,
                    matchup.RegionalEventId
                );

            var teamTwoScore =
                await CalculateTeamScore(
                    matchup.TeamTwoId,
                    matchup.RegionalEventId
                );

            response.Add(new
            {
                matchup.Id,

                Event = new
                {
                    matchup.RegionalEvent.Id,
                    matchup.RegionalEvent.Name,
                    matchup.RegionalEvent.SeasonWeek,
                    matchup.RegionalEvent.Status
                },

                TeamOne = new
                {
                    matchup.TeamOne.Id,

                    Name =
                        matchup.TeamOne
                            .TeamName,

                    Score =
                        teamOneScore
                },

                TeamTwo = new
                {
                    matchup.TeamTwo.Id,

                    Name =
                        matchup.TeamTwo
                            .TeamName,

                    Score =
                        teamTwoScore
                }
            });
        }

        return Ok(response);
    }

    /*
     * Get one matchup with Starting 6
     * scoring breakdown.
     */
    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetMatchup(
        int id)
    {
        var matchup =
            await _context.Matchups
                .Include(m =>
                    m.TeamOne
                )
                .Include(m =>
                    m.TeamTwo
                )
                .Include(m =>
                    m.RegionalEvent
                )
                .FirstOrDefaultAsync(m =>
                    m.Id == id
                );

        if (matchup == null)
        {
            return NotFound(
                "Matchup not found."
            );
        }

        var teamOnePlayers =
            await GetTeamBreakdown(
                matchup.TeamOneId,
                matchup.RegionalEventId
            );

        var teamTwoPlayers =
            await GetTeamBreakdown(
                matchup.TeamTwoId,
                matchup.RegionalEventId
            );

        return Ok(new
        {
            matchup.Id,

            Event = new
            {
                matchup.RegionalEvent.Id,
                matchup.RegionalEvent.Name,
                matchup.RegionalEvent.SeasonWeek,
                matchup.RegionalEvent.Status
            },

            TeamOne = new
            {
                matchup.TeamOne.Id,

                Name =
                    matchup.TeamOne
                        .TeamName,

                Score =
                    teamOnePlayers.Sum(
                        player =>
                            player.FantasyPoints
                    ),

                Players =
                    teamOnePlayers
            },

            TeamTwo = new
            {
                matchup.TeamTwo.Id,

                Name =
                    matchup.TeamTwo
                        .TeamName,

                Score =
                    teamTwoPlayers.Sum(
                        player =>
                            player.FantasyPoints
                    ),

                Players =
                    teamTwoPlayers
            }
        });
    }

    /*
     * Generate/regenerate league schedule.
     *
     * Commissioner only.
     */
    [Authorize]
    [HttpPost("generate/{leagueId:int}")]
    public async Task<ActionResult> GenerateSchedule(
        int leagueId)
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
                    l.Id ==
                    leagueId
                );

        if (league == null)
        {
            return NotFound(
                "League not found."
            );
        }

        var commissioner =
            league.Members
                .FirstOrDefault(member =>
                    member.UserId ==
                        userId.Value &&
                    member.IsCommissioner
                );

        if (commissioner == null)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Only the league commissioner can generate the schedule."
            );
        }

        var teams =
            league.Members
                .OrderBy(member =>
                    member.Id
                )
                .ToList();

        if (teams.Count < 2)
        {
            return BadRequest(
                "At least two teams are required to generate a schedule."
            );
        }

        /*
         * NEW RULE:
         *
         * Only Upcoming Regionals can be added
         * to a newly generated fantasy schedule.
         *
         * Old Live/Final test events will NOT
         * suddenly enter a league schedule.
         */
        var regionalEvents =
            await _context.RegionalEvents
                .Where(eventItem =>
                    eventItem.Status ==
                    "Upcoming"
                )
                .OrderBy(eventItem =>
                    eventItem.SeasonWeek
                )
                .ToListAsync();

        if (
            regionalEvents.Count == 0
        )
        {
            return BadRequest(
                "There are no Upcoming Regionals available to schedule."
            );
        }

        /*
         * Load the league's existing matchups.
         */
        var existingMatchups =
            await _context.Matchups
                .Where(m =>
                    m.LeagueId ==
                    leagueId
                )
                .Include(m =>
                    m.RegionalEvent
                )
                .ToListAsync();

        /*
         * If a started matchup actually had
         * lineup activity, treat it as a real
         * played fantasy matchup and protect it.
         *
         * Started test events with no lineup
         * activity can safely be cleaned up.
         */
        foreach (
            var existingMatchup in
            existingMatchups
        )
        {
            if (
                existingMatchup
                    .RegionalEvent
                    .Status ==
                "Upcoming"
            )
            {
                continue;
            }

            var hasLineup =
                await _context
                    .RegionalLineupEntries
                    .AnyAsync(entry =>
                        entry.RegionalEventId ==
                            existingMatchup
                                .RegionalEventId &&
                        (
                            entry.LeagueMemberId ==
                                existingMatchup
                                    .TeamOneId ||
                            entry.LeagueMemberId ==
                                existingMatchup
                                    .TeamTwoId
                        )
                    );

            if (hasLineup)
            {
                return BadRequest(
                    "This league's schedule cannot be regenerated because a played fantasy matchup has already started."
                );
            }
        }

        /*
         * Existing accidental/upcoming schedule
         * can now safely be removed.
         */
        if (
            existingMatchups.Count > 0
        )
        {
            _context.Matchups
                .RemoveRange(
                    existingMatchups
                );

            await _context
                .SaveChangesAsync();
        }

        var rounds =
            GenerateRoundRobinRounds(
                teams
            );

        if (
            rounds.Count == 0
        )
        {
            return BadRequest(
                "Could not generate round-robin pairings."
            );
        }

        var newMatchups =
            new List<Matchup>();

        for (
            var eventIndex = 0;
            eventIndex <
                regionalEvents.Count;
            eventIndex++
        )
        {
            var regionalEvent =
                regionalEvents[
                    eventIndex
                ];

            var roundIndex =
                eventIndex %
                rounds.Count;

            var pairings =
                rounds[
                    roundIndex
                ];

            foreach (
                var pairing in
                pairings
            )
            {
                newMatchups.Add(
                    new Matchup
                    {
                        LeagueId =
                            leagueId,

                        RegionalEventId =
                            regionalEvent.Id,

                        TeamOneId =
                            pairing.TeamOne.Id,

                        TeamTwoId =
                            pairing.TeamTwo.Id
                    }
                );
            }
        }

        _context.Matchups.AddRange(
            newMatchups
        );

        await _context
            .SaveChangesAsync();

        return Ok(new
        {
            LeagueId =
                leagueId,

            Teams =
                teams.Count,

            Regionals =
                regionalEvents.Count,

            MatchupsCreated =
                newMatchups.Count,

            Message =
                "Schedule generated successfully."
        });
    }

    /*
     * Score only Starting 6 players
     * for this exact Regional.
     */
    private async Task<int> CalculateTeamScore(
        int leagueMemberId,
        int regionalEventId)
    {
        return await _context
            .RegionalLineupEntries
            .Where(entry =>
                entry.LeagueMemberId ==
                    leagueMemberId &&
                entry.RegionalEventId ==
                    regionalEventId
            )
            .Join(
                _context.EventResults
                    .Where(result =>
                        result.RegionalEventId ==
                        regionalEventId
                    ),

                lineup =>
                    lineup.PlayerId,

                result =>
                    result.PlayerId,

                (
                    lineup,
                    result
                ) =>
                    result.FantasyPoints
            )
            .SumAsync();
    }

    /*
     * Starting 6 scoring breakdown.
     */
    private async Task<List<PlayerScoreDto>>
        GetTeamBreakdown(
            int leagueMemberId,
            int regionalEventId)
    {
        var lineupPlayers =
            await _context
                .RegionalLineupEntries
                .Where(entry =>
                    entry.LeagueMemberId ==
                        leagueMemberId &&
                    entry.RegionalEventId ==
                        regionalEventId
                )
                .Include(entry =>
                    entry.Player
                )
                .OrderBy(entry =>
                    entry.Player
                        .SeasonPoolOrder
                )
                .ToListAsync();

        var results =
            await _context.EventResults
                .Where(result =>
                    result.RegionalEventId ==
                    regionalEventId
                )
                .ToListAsync();

        return lineupPlayers
            .Select(lineup =>
            {
                var result =
                    results.FirstOrDefault(
                        result =>
                            result.PlayerId ==
                            lineup.PlayerId
                    );

                return new PlayerScoreDto
                {
                    PlayerId =
                        lineup.Player.Id,

                    Name =
                        lineup.Player.Name,

                    Placement =
                        result?.Placement,

                    FantasyPoints =
                        result?.FantasyPoints ??
                        0
                };
            })
            .ToList();
    }

    /*
     * Round-robin schedule generator.
     */
    private static List<List<TeamPairing>>
        GenerateRoundRobinRounds(
            List<LeagueMember> leagueTeams)
    {
        var teams =
            new List<LeagueMember?>(
                leagueTeams
            );

        if (
            teams.Count % 2 != 0
        )
        {
            teams.Add(null);
        }

        var teamCount =
            teams.Count;

        var rounds =
            new List<
                List<TeamPairing>
            >();

        for (
            var round = 0;
            round <
                teamCount - 1;
            round++
        )
        {
            var pairings =
                new List<TeamPairing>();

            for (
                var i = 0;
                i <
                    teamCount / 2;
                i++
            )
            {
                var teamOne =
                    teams[i];

                var teamTwo =
                    teams[
                        teamCount -
                        1 -
                        i
                    ];

                if (
                    teamOne != null &&
                    teamTwo != null
                )
                {
                    pairings.Add(
                        new TeamPairing
                        {
                            TeamOne =
                                teamOne,

                            TeamTwo =
                                teamTwo
                        }
                    );
                }
            }

            rounds.Add(
                pairings
            );

            var lastTeam =
                teams[
                    teamCount - 1
                ];

            for (
                var i =
                    teamCount - 1;
                i > 1;
                i--
            )
            {
                teams[i] =
                    teams[
                        i - 1
                    ];
            }

            teams[1] =
                lastTeam;
        }

        return rounds;
    }

    /*
     * Application-wide admin check.
     * Uses the same Admin:Email setting
     * as the other admin endpoints.
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
}

public class CreateMatchupRequest
{
    public int LeagueId { get; set; }

    public int RegionalEventId { get; set; }

    public int TeamOneId { get; set; }

    public int TeamTwoId { get; set; }
}

public class PlayerScoreDto
{
    public int PlayerId { get; set; }

    public string Name { get; set; } =
        string.Empty;

    public int? Placement { get; set; }

    public int FantasyPoints { get; set; }
}

public class TeamPairing
{
    public LeagueMember TeamOne { get; set; } =
        null!;

    public LeagueMember TeamTwo { get; set; } =
        null!;
}