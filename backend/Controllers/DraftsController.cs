using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DraftsController : ControllerBase
{
    private readonly AppDbContext _context;

    public DraftsController(AppDbContext context)
    {
        _context = context;
    }

    /*
     * Only league members can view
     * the draft state.
     */
    [Authorize]
    [HttpGet("league/{leagueId:int}")]
    public async Task<ActionResult> GetDraft(
        int leagueId)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var isLeagueMember =
            await _context.LeagueMembers
                .AnyAsync(member =>
                    member.LeagueId == leagueId &&
                    member.UserId == userId.Value
                );

        if (!isLeagueMember)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "You are not a member of this league."
            );
        }

        var draft = await _context.Drafts
            .Include(d => d.Picks)
                .ThenInclude(p => p.Player)
            .Include(d => d.Picks)
                .ThenInclude(p => p.LeagueMember)
            .FirstOrDefaultAsync(d =>
                d.LeagueId == leagueId
            );

        if (draft == null)
        {
            return NotFound(
                "Draft not found."
            );
        }

        return Ok(new
        {
            draft.Id,
            draft.LeagueId,
            draft.IsComplete,
            draft.CreatedAt,

            Picks = draft.Picks
                .OrderBy(p =>
                    p.PickNumber
                )
                .Select(p => new
                {
                    p.Id,
                    p.PickNumber,
                    p.Round,

                    Player = new
                    {
                        p.Player.Id,
                        p.Player.Name,
                        p.Player.Country,
                        p.Player.SeasonStartingRank,
                        p.Player.FantasyPoints,
                        p.Player.RecentFinish
                    },

                    Team = new
                    {
                        Id =
                            p.LeagueMember.Id,

                        Name =
                            p.LeagueMember.TeamName
                    }
                })
        });
    }

    /*
     * Only the commissioner can create/start
     * the league draft.
     */
    [Authorize]
    [HttpPost("league/{leagueId:int}")]
    public async Task<ActionResult> CreateDraft(
        int leagueId)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
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
                "Only the league commissioner can start the draft."
            );
        }

        if (league.Members.Count < 2)
        {
            return BadRequest(
                "At least two teams are required to start a draft."
            );
        }

        var existingDraft =
            await _context.Drafts
                .FirstOrDefaultAsync(d =>
                    d.LeagueId ==
                    leagueId
                );

        if (existingDraft != null)
        {
            return Ok(existingDraft);
        }

        var draft =
            new Draft
            {
                LeagueId =
                    leagueId
            };

        _context.Drafts.Add(
            draft
        );

        await _context
            .SaveChangesAsync();

        return Ok(new
        {
            draft.Id,
            draft.LeagueId,
            draft.IsComplete,
            draft.CreatedAt
        });
    }

    /*
     * Only the commissioner can complete
     * the draft and create permanent rosters.
     */
    [Authorize]
    [HttpPost("{draftId:int}/complete")]
    public async Task<ActionResult> CompleteDraft(
        int draftId)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var draft =
            await _context.Drafts
                .Include(d =>
                    d.Picks
                )
                .FirstOrDefaultAsync(d =>
                    d.Id ==
                    draftId
                );

        if (draft == null)
        {
            return NotFound(
                "Draft not found."
            );
        }

        var commissioner =
            await _context.LeagueMembers
                .FirstOrDefaultAsync(member =>
                    member.LeagueId ==
                        draft.LeagueId &&
                    member.UserId ==
                        userId.Value &&
                    member.IsCommissioner
                );

        if (commissioner == null)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Only the league commissioner can complete the draft."
            );
        }

        if (draft.IsComplete)
        {
            return BadRequest(
                "Draft is already complete."
            );
        }

        if (draft.Picks.Count == 0)
        {
            return BadRequest(
                "Cannot complete an empty draft."
            );
        }

        var existingRosterPlayers =
            await _context.RosterPlayers
                .Where(r =>
                    r.LeagueMember
                        .LeagueId ==
                    draft.LeagueId
                )
                .ToListAsync();

        if (
            existingRosterPlayers.Count >
            0
        )
        {
            return BadRequest(
                "Season rosters already exist for this league."
            );
        }

        var rosterPlayers =
            draft.Picks
                .Select(
                    pick =>
                        new RosterPlayer
                        {
                            LeagueMemberId =
                                pick.LeagueMemberId,

                            PlayerId =
                                pick.PlayerId
                        }
                )
                .ToList();

        _context.RosterPlayers
            .AddRange(
                rosterPlayers
            );

        draft.IsComplete = true;

        await _context
            .SaveChangesAsync();

        return Ok(new
        {
            message =
                "Draft completed successfully.",

            draft.Id,
            draft.LeagueId,
            draft.IsComplete
        });
    }

    /*
     * Only the logged-in user who owns
     * the team whose turn it is may pick.
     */
    [Authorize]
    [HttpPost("{draftId:int}/pick")]
    public async Task<ActionResult> MakePick(
        int draftId,
        MakeDraftPickRequest request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var draft =
            await _context.Drafts
                .Include(d =>
                    d.Picks
                )
                .FirstOrDefaultAsync(d =>
                    d.Id ==
                    draftId
                );

        if (draft == null)
        {
            return NotFound(
                "Draft not found."
            );
        }

        if (draft.IsComplete)
        {
            return BadRequest(
                "This draft is complete."
            );
        }

        var player =
            await _context.Players
                .FirstOrDefaultAsync(p =>
                    p.Id ==
                    request.PlayerId
                );

        if (player == null)
        {
            return NotFound(
                "Player not found."
            );
        }

        var alreadyDrafted =
            draft.Picks.Any(
                p =>
                    p.PlayerId ==
                    player.Id
            );

        if (alreadyDrafted)
        {
            return BadRequest(
                "This player has already been drafted."
            );
        }

        /*
         * Load teams in the same order
         * used for the snake draft.
         */
        var teams =
            await _context.LeagueMembers
                .Where(m =>
                    m.LeagueId ==
                    draft.LeagueId
                )
                .OrderBy(m =>
                    m.Id
                )
                .ToListAsync();

        if (teams.Count == 0)
        {
            return BadRequest(
                "This league has no teams."
            );
        }

        /*
         * Determine whose turn it is.
         */
        var pickIndex =
            draft.Picks.Count;

        var round =
            (pickIndex /
                teams.Count) + 1;

        var position =
            pickIndex %
            teams.Count;

        LeagueMember currentTeam;

        if (round % 2 == 1)
        {
            currentTeam =
                teams[position];
        }
        else
        {
            currentTeam =
                teams[
                    teams.Count -
                    1 -
                    position
                ];
        }

        /*
         * SECURITY:
         *
         * The authenticated user must own
         * the team whose turn it is.
         */
        if (
            currentTeam.UserId !=
            userId.Value
        )
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                $"It is currently {currentTeam.TeamName}'s turn."
            );
        }

        var pick =
            new DraftPick
            {
                DraftId =
                    draft.Id,

                PlayerId =
                    player.Id,

                LeagueMemberId =
                    currentTeam.Id,

                PickNumber =
                    pickIndex + 1,

                Round =
                    round
            };

        _context.DraftPicks.Add(
            pick
        );

        await _context
            .SaveChangesAsync();

        return Ok(new
        {
            pick.Id,
            pick.PickNumber,
            pick.Round,

            Player = new
            {
                player.Id,
                player.Name,
                player.Country,
                player.SeasonStartingRank,
                player.FantasyPoints,
                player.RecentFinish
            },

            Team = new
            {
                Id =
                    currentTeam.Id,

                Name =
                    currentTeam.TeamName
            }
        });
    }

    /*
     * Reads authenticated User ID
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
}

public class MakeDraftPickRequest
{
    public int PlayerId { get; set; }
}