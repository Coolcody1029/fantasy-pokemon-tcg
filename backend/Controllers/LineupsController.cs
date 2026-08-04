using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/lineups")]
[Authorize]
public class LineupsController : ControllerBase
{
    private readonly AppDbContext _context;

    public LineupsController(AppDbContext context)
    {
        _context = context;
    }

    // GET the submitted lineup for the logged-in user's team
    // at a Regional.
    [HttpGet("team/{teamId:int}/event/{eventId:int}")]
    public async Task<ActionResult> GetLineup(
        int teamId,
        int eventId)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var team = await _context.LeagueMembers
            .FirstOrDefaultAsync(member =>
                member.Id == teamId
            );

        if (team == null)
        {
            return NotFound(
                "Fantasy team not found."
            );
        }

        /*
         * SECURITY:
         * The logged-in user must own this fantasy team.
         */
        if (team.UserId != userId.Value)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "You do not have permission to view this lineup."
            );
        }

        var regionalEvent =
            await _context.RegionalEvents
                .FirstOrDefaultAsync(regional =>
                    regional.Id == eventId
                );

        if (regionalEvent == null)
        {
            return NotFound(
                "Regional event not found."
            );
        }

        var lineup =
            await _context.RegionalLineupEntries
                .Where(entry =>
                    entry.LeagueMemberId == teamId &&
                    entry.RegionalEventId == eventId
                )
                .Include(entry =>
                    entry.Player
                )
                .OrderBy(entry =>
                    entry.Player.SeasonPoolOrder
                )
                .Select(entry => new
                {
                    entry.Player.Id,
                    entry.Player.Name,
                    entry.Player.Country,
                    entry.Player.SeasonStartingRank,
                    entry.Player.SeasonPoolOrder,
                    entry.Player.FantasyPoints
                })
                .ToListAsync();

        return Ok(lineup);
    }

    // PUT replaces the logged-in user's lineup
    // for this Regional.
    [HttpPut("team/{teamId:int}/event/{eventId:int}")]
    public async Task<ActionResult> SetLineup(
        int teamId,
        int eventId,
        SetRegionalLineupRequest request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        /*
         * Validate exactly six players.
         */
        if (
            request.PlayerIds == null ||
            request.PlayerIds.Count != 6
        )
        {
            return BadRequest(
                "A Regional lineup must contain exactly 6 players."
            );
        }

        /*
         * Prevent duplicates.
         */
        if (
            request.PlayerIds
                .Distinct()
                .Count() != 6
        )
        {
            return BadRequest(
                "A player cannot appear in the lineup more than once."
            );
        }

        /*
         * Find the fantasy team.
         */
        var team =
            await _context.LeagueMembers
                .FirstOrDefaultAsync(member =>
                    member.Id == teamId
                );

        if (team == null)
        {
            return NotFound(
                "Fantasy team not found."
            );
        }

        /*
         * SECURITY:
         *
         * A user can ONLY submit a lineup
         * for a fantasy team they own.
         */
        if (team.UserId != userId.Value)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "You do not have permission to edit this lineup."
            );
        }

        /*
         * Make sure the Regional exists.
         */
        var regionalEvent =
            await _context.RegionalEvents
                .FirstOrDefaultAsync(regional =>
                    regional.Id == eventId
                );

        if (regionalEvent == null)
        {
            return NotFound(
                "Regional event not found."
            );
        }

        /*
         * Lineups lock once the Regional
         * goes Live or Final.
         */
        if (
            regionalEvent.Status !=
            "Upcoming"
        )
        {
            return BadRequest(
                "This lineup is locked because the Regional has already started."
            );
        }

        /*
         * Get every player permanently
         * owned by this fantasy team.
         */
        var ownedPlayerIds =
            await _context.RosterPlayers
                .Where(roster =>
                    roster.LeagueMemberId ==
                    teamId
                )
                .Select(roster =>
                    roster.PlayerId
                )
                .ToListAsync();

        /*
         * Every selected player must
         * belong to this team's roster.
         */
        var invalidPlayerIds =
            request.PlayerIds
                .Where(playerId =>
                    !ownedPlayerIds.Contains(
                        playerId
                    )
                )
                .ToList();

        if (
            invalidPlayerIds.Count > 0
        )
        {
            return BadRequest(
                "Every selected player must belong to this fantasy team."
            );
        }

        /*
         * Remove the previously submitted
         * lineup for this Regional.
         */
        var existingLineup =
            await _context
                .RegionalLineupEntries
                .Where(entry =>
                    entry.LeagueMemberId ==
                        teamId &&
                    entry.RegionalEventId ==
                        eventId
                )
                .ToListAsync();

        _context
            .RegionalLineupEntries
            .RemoveRange(
                existingLineup
            );

        /*
         * Save the new starting six.
         */
        var newEntries =
            request.PlayerIds
                .Select(playerId =>
                    new RegionalLineupEntry
                    {
                        LeagueMemberId =
                            teamId,

                        RegionalEventId =
                            eventId,

                        PlayerId =
                            playerId
                    }
                )
                .ToList();

        _context
            .RegionalLineupEntries
            .AddRange(
                newEntries
            );

        await _context
            .SaveChangesAsync();

        return Ok(new
        {
            teamId,
            eventId,
            playerCount =
                newEntries.Count,

            message =
                "Regional lineup saved successfully."
        });
    }

    /*
     * Reads the User ID stored inside
     * the JWT created during login.
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
}

public class SetRegionalLineupRequest
{
    public List<int> PlayerIds { get; set; }
        = new();
}