using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchupsController : ControllerBase
{
    private readonly AppDbContext _context;

    public MatchupsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult> CreateMatchup(
        CreateMatchupRequest request)
    {
        var league = await _context.Leagues
            .FirstOrDefaultAsync(l => l.Id == request.LeagueId);

        if (league == null)
        {
            return NotFound("League not found.");
        }

        var regionalEvent = await _context.RegionalEvents
            .FirstOrDefaultAsync(e => e.Id == request.RegionalEventId);

        if (regionalEvent == null)
        {
            return NotFound("Regional event not found.");
        }

        var teamOne = await _context.LeagueMembers
            .FirstOrDefaultAsync(m =>
                m.Id == request.TeamOneId &&
                m.LeagueId == request.LeagueId
            );

        var teamTwo = await _context.LeagueMembers
            .FirstOrDefaultAsync(m =>
                m.Id == request.TeamTwoId &&
                m.LeagueId == request.LeagueId
            );

        if (teamOne == null || teamTwo == null)
        {
            return BadRequest(
                "Both teams must belong to this league."
            );
        }

        if (teamOne.Id == teamTwo.Id)
        {
            return BadRequest(
                "A team cannot play against itself."
            );
        }

        var matchup = new Matchup
        {
            LeagueId = request.LeagueId,
            RegionalEventId = request.RegionalEventId,
            TeamOneId = request.TeamOneId,
            TeamTwoId = request.TeamTwoId
        };

        _context.Matchups.Add(matchup);

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

    [HttpGet("league/{leagueId:int}")]
    public async Task<ActionResult> GetLeagueMatchups(
        int leagueId)
    {
        var matchups = await _context.Matchups
            .Where(m => m.LeagueId == leagueId)
            .Include(m => m.TeamOne)
            .Include(m => m.TeamTwo)
            .Include(m => m.RegionalEvent)
            .OrderBy(m => m.RegionalEvent.SeasonWeek)
            .ToListAsync();

        var response = new List<object>();

        foreach (var matchup in matchups)
        {
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
                    Name = matchup.TeamOne.TeamName,
                    Score = teamOneScore
                },

                TeamTwo = new
                {
                    matchup.TeamTwo.Id,
                    Name = matchup.TeamTwo.TeamName,
                    Score = teamTwoScore
                }
            });
        }

        return Ok(response);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetMatchup(int id)
    {
        var matchup = await _context.Matchups
            .Include(m => m.TeamOne)
            .Include(m => m.TeamTwo)
            .Include(m => m.RegionalEvent)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (matchup == null)
        {
            return NotFound("Matchup not found.");
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
                Name = matchup.TeamOne.TeamName,
                Score = teamOnePlayers.Sum(p => p.FantasyPoints),
                Players = teamOnePlayers
            },

            TeamTwo = new
            {
                matchup.TeamTwo.Id,
                Name = matchup.TeamTwo.TeamName,
                Score = teamTwoPlayers.Sum(p => p.FantasyPoints),
                Players = teamTwoPlayers
            }
        });
    }
    
    [Authorize]
    [HttpPost("generate/{leagueId:int}")]
    public async Task<ActionResult> GenerateSchedule(int leagueId)
    {
    var userIdClaim =
        User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

    if (!int.TryParse(
            userIdClaim,
            out var userId))
    {
        return Unauthorized();
    }

    var league = await _context.Leagues
        .Include(l => l.Members)
        .FirstOrDefaultAsync(l =>
            l.Id == leagueId
        );

    if (league == null)
    {
        return NotFound(
            "League not found."
        );
    }

    var commissioner =
        league.Members.FirstOrDefault(member =>
            member.UserId == userId &&
            member.IsCommissioner
        );

    if (commissioner == null)
    {
        return StatusCode(
            StatusCodes.Status403Forbidden,
            "Only the league commissioner can generate the schedule."
        );
    }

    var teams = league.Members
        .OrderBy(member => member.Id)
        .ToList();

    if (teams.Count < 2)
    {
        return BadRequest(
            "At least two teams are required to generate a schedule."
        );
    }

    var regionalEvents =
        await _context.RegionalEvents
            .OrderBy(e => e.SeasonWeek)
            .ToListAsync();

    if (regionalEvents.Count == 0)
    {
        return BadRequest(
            "No Regional events exist yet."
        );
    }

    /*
     * Once any Regional has started, don't allow
     * the schedule to be regenerated.
     */
    if (regionalEvents.Any(regional =>
        regional.Status != "Upcoming"))
    {
        return BadRequest(
            "The schedule cannot be regenerated after a Regional has started."
        );
    }

    var existingMatchups =
        await _context.Matchups
            .Where(m =>
                m.LeagueId == leagueId
            )
            .ToListAsync();

    if (existingMatchups.Count > 0)
    {
        _context.Matchups.RemoveRange(
            existingMatchups
        );

        await _context.SaveChangesAsync();
    }

    var rounds =
        GenerateRoundRobinRounds(teams);

    var newMatchups =
        new List<Matchup>();

    for (
        int eventIndex = 0;
        eventIndex < regionalEvents.Count;
        eventIndex++
    )
    {
        var regionalEvent =
            regionalEvents[eventIndex];

        var roundIndex =
            eventIndex % rounds.Count;

        var pairings =
            rounds[roundIndex];

        foreach (var pairing in pairings)
        {
            newMatchups.Add(
                new Matchup
                {
                    LeagueId = leagueId,

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

    await _context.SaveChangesAsync();

    return Ok(new
    {
        LeagueId = leagueId,
        Teams = teams.Count,
        Regionals = regionalEvents.Count,
        MatchupsCreated =
            newMatchups.Count,

        Message =
            "Schedule generated successfully."
    });
    }
   
    
    private async Task<int> CalculateTeamScore(
    int leagueMemberId,
    int regionalEventId)
{
    return await _context.RegionalLineupEntries
        .Where(entry =>
            entry.LeagueMemberId == leagueMemberId &&
            entry.RegionalEventId == regionalEventId
        )
        .Join(
            _context.EventResults.Where(result =>
                result.RegionalEventId == regionalEventId
            ),
            lineup => lineup.PlayerId,
            result => result.PlayerId,
            (lineup, result) => result.FantasyPoints
        )
        .SumAsync();

    }

    private async Task<List<PlayerScoreDto>> GetTeamBreakdown(
    int leagueMemberId,
    int regionalEventId)
    {
    var lineupPlayers = await _context.RegionalLineupEntries
        .Where(entry =>
            entry.LeagueMemberId == leagueMemberId &&
            entry.RegionalEventId == regionalEventId
        )
        .Include(entry => entry.Player)
        .OrderBy(entry => entry.Player.SeasonPoolOrder)
        .ToListAsync();

    var results = await _context.EventResults
        .Where(result =>
            result.RegionalEventId == regionalEventId
        )
        .ToListAsync();

    return lineupPlayers
        .Select(lineup =>
        {
            var result = results.FirstOrDefault(result =>
                result.PlayerId == lineup.PlayerId
            );

            return new PlayerScoreDto
            {
                PlayerId = lineup.Player.Id,
                Name = lineup.Player.Name,
                Placement = result?.Placement,
                FantasyPoints = result?.FantasyPoints ?? 0
            };
        })
        .ToList();
    }
 
    
    private static List<List<TeamPairing>>
    GenerateRoundRobinRounds(
        List<LeagueMember> leagueTeams)
    {
    var teams = new List<LeagueMember?>(leagueTeams);

    // Odd number of teams means one team gets a bye.
    if (teams.Count % 2 != 0)
    {
        teams.Add(null);
    }

    var teamCount = teams.Count;

    var rounds =
        new List<List<TeamPairing>>();

    for (int round = 0;
         round < teamCount - 1;
         round++)
    {
        var pairings =
            new List<TeamPairing>();

        for (int i = 0;
             i < teamCount / 2;
             i++)
        {
            var teamOne = teams[i];
            var teamTwo =
                teams[teamCount - 1 - i];

            // A null team represents a bye.
            if (teamOne != null &&
                teamTwo != null)
            {
                pairings.Add(
                    new TeamPairing
                    {
                        TeamOne = teamOne,
                        TeamTwo = teamTwo
                    }
                );
            }
        }

        rounds.Add(pairings);

        // Keep the first team fixed and rotate
        // everybody else around it.
        var lastTeam =
            teams[teamCount - 1];

        for (int i = teamCount - 1;
             i > 1;
             i--)
        {
            teams[i] = teams[i - 1];
        }

        teams[1] = lastTeam;
    }

    return rounds;
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
    public LeagueMember TeamOne { get; set; } = null!;

    public LeagueMember TeamTwo { get; set; } = null!;
}