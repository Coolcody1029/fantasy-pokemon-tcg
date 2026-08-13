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
                    request.TeamTwoId,

                MatchupType =
                    regionalEvent.FantasyStage == "Playoff"
                        ? "Semifinal"
                        : regionalEvent.FantasyStage == "Championship"
                            ? "Championship"
                            : "RegularSeason"
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
            matchup.TeamTwoId,
            matchup.MatchupType,
            matchup.WinnerId,
            matchup.IsFinalized
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
                    matchup.RegionalEvent.Status,
                    matchup.RegionalEvent.FantasyStage
                },

                matchup.MatchupType,
                matchup.WinnerId,
                matchup.IsFinalized,

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
                matchup.RegionalEvent.Status,
                matchup.RegionalEvent.FantasyStage
            },

            matchup.MatchupType,
            matchup.WinnerId,
            matchup.IsFinalized,

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
                        "Upcoming" &&
                    eventItem.FantasyStage ==
                        "RegularSeason"
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
                            pairing.TeamTwo.Id,

                        MatchupType =
                            "RegularSeason"
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
     * Build and advance the league postseason.
     *
     * Commissioner only.
     *
     * Current supported format:
     *
     * Top 4 after the regular season
     * #1 vs #4
     * #2 vs #3
     *
     * The two semifinal winners then play
     * during the Championship event.
     *
     * This endpoint is intentionally idempotent.
     * It can be called again as the postseason
     * progresses without duplicating matchups.
     */
    [Authorize]
    [HttpPost("postseason/{leagueId:int}")]
    public async Task<ActionResult> GeneratePostseason(
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
                "Only the league commissioner can manage the postseason."
            );
        }

        /*
         * The first release intentionally supports
         * the four-team playoff format only.
         *
         * Keeping the value on League still lets us
         * expand to other formats later without
         * redesigning the database again.
         */
        if (league.PlayoffTeamCount != 4)
        {
            return BadRequest(
                "The current postseason format requires exactly 4 playoff teams."
            );
        }

        if (league.Members.Count < 4)
        {
            return BadRequest(
                "At least four teams are required for the playoffs."
            );
        }

        var playoffEvent =
            await _context.RegionalEvents
                .Where(eventItem =>
                    eventItem.FantasyStage ==
                    "Playoff"
                )
                .OrderBy(eventItem =>
                    eventItem.SeasonWeek
                )
                .FirstOrDefaultAsync();

        if (playoffEvent == null)
        {
            return BadRequest(
                "No Regional has been marked as the Playoff event."
            );
        }

        var championshipEvent =
            await _context.RegionalEvents
                .Where(eventItem =>
                    eventItem.FantasyStage ==
                    "Championship"
                )
                .OrderBy(eventItem =>
                    eventItem.SeasonWeek
                )
                .FirstOrDefaultAsync();

        if (championshipEvent == null)
        {
            return BadRequest(
                "No event has been marked as the Championship event."
            );
        }

        if (
            championshipEvent.SeasonWeek <=
            playoffEvent.SeasonWeek
        )
        {
            return BadRequest(
                "The Championship event must occur after the Playoff event."
            );
        }

        var semifinalMatchups =
            await _context.Matchups
                .Where(matchup =>
                    matchup.LeagueId ==
                        leagueId &&
                    matchup.MatchupType ==
                        "Semifinal"
                )
                .Include(matchup =>
                    matchup.RegionalEvent
                )
                .OrderBy(matchup =>
                    matchup.Id
                )
                .ToListAsync();

        /*
         * PHASE 1:
         * Create the semifinals from the final
         * regular-season standings.
         */
        if (semifinalMatchups.Count == 0)
        {
            if (playoffEvent.Status != "Upcoming")
            {
                return BadRequest(
                    "The Playoff event must still be Upcoming before semifinal matchups are created."
                );
            }

            var regularSeasonMatchups =
                await _context.Matchups
                    .Where(matchup =>
                        matchup.LeagueId ==
                            leagueId &&
                        matchup.MatchupType ==
                            "RegularSeason"
                    )
                    .Include(matchup =>
                        matchup.RegionalEvent
                    )
                    .ToListAsync();

            if (regularSeasonMatchups.Count == 0)
            {
                return BadRequest(
                    "This league does not have a regular-season schedule."
                );
            }

            var unfinishedRegularSeason =
                regularSeasonMatchups.Any(matchup =>
                    matchup.RegionalEvent.Status !=
                        "Final"
                );

            if (unfinishedRegularSeason)
            {
                return BadRequest(
                    "The regular season must be fully Final before playoff seeding can be created."
                );
            }

            var standings =
                await GetRegularSeasonStandings(
                    leagueId
                );

            if (standings.Count < 4)
            {
                return BadRequest(
                    "There are not enough teams in the regular-season standings to create the playoffs."
                );
            }

            var seedOne = standings[0];
            var seedTwo = standings[1];
            var seedThree = standings[2];
            var seedFour = standings[3];

            var newSemifinals =
                new List<Matchup>
                {
                    new()
                    {
                        LeagueId = leagueId,
                        RegionalEventId =
                            playoffEvent.Id,
                        TeamOneId =
                            seedOne.TeamId,
                        TeamTwoId =
                            seedFour.TeamId,
                        MatchupType =
                            "Semifinal"
                    },
                    new()
                    {
                        LeagueId = leagueId,
                        RegionalEventId =
                            playoffEvent.Id,
                        TeamOneId =
                            seedTwo.TeamId,
                        TeamTwoId =
                            seedThree.TeamId,
                        MatchupType =
                            "Semifinal"
                    }
                };

            _context.Matchups.AddRange(
                newSemifinals
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                LeagueId = leagueId,
                Stage = "Semifinal",
                Event = playoffEvent.Name,
                Seeds = standings
                    .Take(4)
                    .Select(standing =>
                        new
                        {
                            standing.Seed,
                            standing.TeamId,
                            standing.TeamName,
                            standing.Wins,
                            standing.Losses,
                            standing.Ties,
                            standing.PointsFor
                        }
                    ),
                Matchups = newSemifinals
                    .Select(matchup =>
                        new
                        {
                            matchup.Id,
                            matchup.TeamOneId,
                            matchup.TeamTwoId
                        }
                    ),
                Message =
                    "Fantasy TCG playoff semifinals created successfully."
            });
        }

        if (semifinalMatchups.Count != 2)
        {
            return BadRequest(
                "This league must have exactly two semifinal matchups."
            );
        }

        /*
         * PHASE 2:
         * Once the Playoff Regional is Final,
         * finalize the semifinals and create
         * the World Championship matchup.
         */
        if (
            semifinalMatchups.Any(matchup =>
                !matchup.IsFinalized
            )
        )
        {
            if (playoffEvent.Status != "Final")
            {
                return Ok(new
                {
                    LeagueId = leagueId,
                    Stage = "Semifinal",
                    Event = playoffEvent.Name,
                    Status = playoffEvent.Status,
                    Message =
                        "The semifinals exist and will advance once the Playoff event is Final."
                });
            }

            var standings =
                await GetRegularSeasonStandings(
                    leagueId
                );

            var seedLookup =
                standings.ToDictionary(
                    standing =>
                        standing.TeamId,
                    standing =>
                        standing.Seed
                );

            foreach (
                var semifinal in
                semifinalMatchups
            )
            {
                var teamOneScore =
                    await CalculateTeamScore(
                        semifinal.TeamOneId,
                        semifinal.RegionalEventId
                    );

                var teamTwoScore =
                    await CalculateTeamScore(
                        semifinal.TeamTwoId,
                        semifinal.RegionalEventId
                    );

                semifinal.WinnerId =
                    ResolvePostseasonWinner(
                        semifinal.TeamOneId,
                        teamOneScore,
                        semifinal.TeamTwoId,
                        teamTwoScore,
                        seedLookup
                    );

                semifinal.IsFinalized =
                    true;
            }

            await _context.SaveChangesAsync();
        }

        var championshipMatchup =
            await _context.Matchups
                .Include(matchup =>
                    matchup.TeamOne
                )
                .Include(matchup =>
                    matchup.TeamTwo
                )
                .FirstOrDefaultAsync(matchup =>
                    matchup.LeagueId ==
                        leagueId &&
                    matchup.MatchupType ==
                        "Championship"
                );

        if (championshipMatchup == null)
        {
            if (championshipEvent.Status != "Upcoming")
            {
                return BadRequest(
                    "The Championship event must still be Upcoming before the championship matchup is created."
                );
            }

            var semifinalWinners =
                semifinalMatchups
                    .Where(matchup =>
                        matchup.IsFinalized &&
                        matchup.WinnerId.HasValue
                    )
                    .Select(matchup =>
                        matchup.WinnerId!.Value
                    )
                    .ToList();

            if (semifinalWinners.Count != 2)
            {
                return BadRequest(
                    "Both semifinal winners must be finalized before the championship matchup can be created."
                );
            }

            championshipMatchup =
                new Matchup
                {
                    LeagueId = leagueId,
                    RegionalEventId =
                        championshipEvent.Id,
                    TeamOneId =
                        semifinalWinners[0],
                    TeamTwoId =
                        semifinalWinners[1],
                    MatchupType =
                        "Championship"
                };

            _context.Matchups.Add(
                championshipMatchup
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                LeagueId = leagueId,
                Stage = "Championship",
                Event = championshipEvent.Name,
                championshipMatchup.Id,
                championshipMatchup.TeamOneId,
                championshipMatchup.TeamTwoId,
                Message =
                    "Fantasy TCG Championship matchup created successfully."
            });
        }

        /*
         * PHASE 3:
         * Once Worlds is Final, permanently
         * record the Fantasy TCG champion.
         */
        if (
            championshipEvent.Status == "Final" &&
            !championshipMatchup.IsFinalized
        )
        {
            var standings =
                await GetRegularSeasonStandings(
                    leagueId
                );

            var seedLookup =
                standings.ToDictionary(
                    standing =>
                        standing.TeamId,
                    standing =>
                        standing.Seed
                );

            var teamOneScore =
                await CalculateTeamScore(
                    championshipMatchup.TeamOneId,
                    championshipMatchup.RegionalEventId
                );

            var teamTwoScore =
                await CalculateTeamScore(
                    championshipMatchup.TeamTwoId,
                    championshipMatchup.RegionalEventId
                );

            championshipMatchup.WinnerId =
                ResolvePostseasonWinner(
                    championshipMatchup.TeamOneId,
                    teamOneScore,
                    championshipMatchup.TeamTwoId,
                    teamTwoScore,
                    seedLookup
                );

            championshipMatchup.IsFinalized =
                true;

            await _context.SaveChangesAsync();
        }

        if (
            championshipMatchup.IsFinalized &&
            championshipMatchup.WinnerId.HasValue
        )
        {
            var champion =
                league.Members
                    .FirstOrDefault(member =>
                        member.Id ==
                            championshipMatchup.WinnerId.Value
                    );

            return Ok(new
            {
                LeagueId = leagueId,
                Stage = "Champion",
                ChampionshipEvent =
                    championshipEvent.Name,
                Champion = champion == null
                    ? null
                    : new
                    {
                        champion.Id,
                        Name = champion.TeamName
                    },
                Message =
                    "The Fantasy TCG season is complete."
            });
        }

        return Ok(new
        {
            LeagueId = leagueId,
            Stage = "Championship",
            Event = championshipEvent.Name,
            Status = championshipEvent.Status,
            championshipMatchup.Id,
            championshipMatchup.TeamOneId,
            championshipMatchup.TeamTwoId,
            Message =
                "The Fantasy TCG Championship matchup is ready."
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
     * Build regular-season standings for
     * postseason seeding.
     *
     * Ordering:
     * 1. Wins
     * 2. Ties
     * 3. Total fantasy points scored
     * 4. Team ID as a deterministic final fallback
     *
     * Final matchups with no submitted lineup are
     * ignored here exactly like GetLeagueMatchups.
     */
    private async Task<List<PostseasonStanding>>
        GetRegularSeasonStandings(
            int leagueId)
    {
        var teams =
            await _context.LeagueMembers
                .Where(member =>
                    member.LeagueId ==
                    leagueId
                )
                .OrderBy(member =>
                    member.Id
                )
                .ToListAsync();

        var standings =
            teams.ToDictionary(
                team =>
                    team.Id,
                team =>
                    new PostseasonStanding
                    {
                        TeamId = team.Id,
                        TeamName =
                            team.TeamName
                    }
            );

        var matchups =
            await _context.Matchups
                .Where(matchup =>
                    matchup.LeagueId ==
                        leagueId &&
                    matchup.MatchupType ==
                        "RegularSeason" &&
                    matchup.RegionalEvent.Status ==
                        "Final"
                )
                .Include(matchup =>
                    matchup.RegionalEvent
                )
                .ToListAsync();

        foreach (
            var matchup in
            matchups
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

            var teamOne =
                standings[
                    matchup.TeamOneId
                ];

            var teamTwo =
                standings[
                    matchup.TeamTwoId
                ];

            teamOne.GamesPlayed++;
            teamTwo.GamesPlayed++;

            teamOne.PointsFor +=
                teamOneScore;

            teamTwo.PointsFor +=
                teamTwoScore;

            if (teamOneScore > teamTwoScore)
            {
                teamOne.Wins++;
                teamTwo.Losses++;
            }
            else if (teamTwoScore > teamOneScore)
            {
                teamTwo.Wins++;
                teamOne.Losses++;
            }
            else
            {
                teamOne.Ties++;
                teamTwo.Ties++;
            }
        }

        var ordered =
            standings.Values
                .OrderByDescending(standing =>
                    standing.Wins
                )
                .ThenByDescending(standing =>
                    standing.Ties
                )
                .ThenByDescending(standing =>
                    standing.PointsFor
                )
                .ThenBy(standing =>
                    standing.TeamId
                )
                .ToList();

        for (
            var index = 0;
            index < ordered.Count;
            index++
        )
        {
            ordered[index].Seed =
                index + 1;
        }

        return ordered;
    }

    /*
     * Resolve a postseason winner.
     *
     * If fantasy scores are tied, the higher
     * regular-season seed advances. This avoids
     * an unresolved playoff bracket while keeping
     * the tiebreak deterministic.
     */
    private static int ResolvePostseasonWinner(
        int teamOneId,
        int teamOneScore,
        int teamTwoId,
        int teamTwoScore,
        Dictionary<int, int> seedLookup)
    {
        if (teamOneScore > teamTwoScore)
        {
            return teamOneId;
        }

        if (teamTwoScore > teamOneScore)
        {
            return teamTwoId;
        }

        var teamOneSeed =
            seedLookup.TryGetValue(
                teamOneId,
                out var seedOne
            )
                ? seedOne
                : int.MaxValue;

        var teamTwoSeed =
            seedLookup.TryGetValue(
                teamTwoId,
                out var seedTwo
            )
                ? seedTwo
                : int.MaxValue;

        if (teamOneSeed < teamTwoSeed)
        {
            return teamOneId;
        }

        if (teamTwoSeed < teamOneSeed)
        {
            return teamTwoId;
        }

        return Math.Min(
            teamOneId,
            teamTwoId
        );
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

public class PostseasonStanding
{
    public int Seed { get; set; }

    public int TeamId { get; set; }

    public string TeamName { get; set; } =
        string.Empty;

    public int GamesPlayed { get; set; }

    public int Wins { get; set; }

    public int Losses { get; set; }

    public int Ties { get; set; }

    public int PointsFor { get; set; }
}