using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

    [HttpGet("league/{leagueId:int}")]
    public async Task<ActionResult> GetDraft(int leagueId)
    {
        var draft = await _context.Drafts
            .Include(d => d.Picks)
                .ThenInclude(p => p.Player)
            .Include(d => d.Picks)
                .ThenInclude(p => p.LeagueMember)
            .FirstOrDefaultAsync(d => d.LeagueId == leagueId);

        if (draft == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            draft.Id,
            draft.LeagueId,
            draft.IsComplete,
            draft.CreatedAt,

            Picks = draft.Picks
                .OrderBy(p => p.PickNumber)
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
                        Id = p.LeagueMember.Id,
                        Name = p.LeagueMember.TeamName
                    }
                })
        });
    }

    [HttpPost("league/{leagueId:int}")]
    public async Task<ActionResult> CreateDraft(int leagueId)
    {
        var league = await _context.Leagues
            .Include(l => l.Members)
            .FirstOrDefaultAsync(l => l.Id == leagueId);

        if (league == null)
        {
            return NotFound("League not found.");
        }

        if (league.Members.Count < 2)
        {
            return BadRequest(
                "At least two teams are required to start a draft."
            );
        }

        var existingDraft = await _context.Drafts
            .FirstOrDefaultAsync(d => d.LeagueId == leagueId);

        if (existingDraft != null)
        {
            return Ok(existingDraft);
        }

        var draft = new Draft
        {
            LeagueId = leagueId
        };

        _context.Drafts.Add(draft);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            draft.Id,
            draft.LeagueId,
            draft.IsComplete,
            draft.CreatedAt
        });
    }
    [HttpPost("{draftId:int}/complete")]
    public async Task<ActionResult> CompleteDraft(int draftId)
    {
    var draft = await _context.Drafts
        .Include(d => d.Picks)
        .FirstOrDefaultAsync(d => d.Id == draftId);

    if (draft == null)
    {
        return NotFound("Draft not found.");
    }

    if (draft.IsComplete)
    {
        return BadRequest("Draft is already complete.");
    }

    if (draft.Picks.Count == 0)
    {
        return BadRequest("Cannot complete an empty draft.");
    }

    var existingRosterPlayers = await _context.RosterPlayers
        .Where(r => r.LeagueMember.LeagueId == draft.LeagueId)
        .ToListAsync();

    if (existingRosterPlayers.Count > 0)
    {
        return BadRequest("Season rosters already exist for this league.");
    }

    var rosterPlayers = draft.Picks.Select(pick => new RosterPlayer
    {
        LeagueMemberId = pick.LeagueMemberId,
        PlayerId = pick.PlayerId
    });

    _context.RosterPlayers.AddRange(rosterPlayers);

    draft.IsComplete = true;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Draft completed successfully.",
        draft.Id,
        draft.LeagueId,
        draft.IsComplete
    });
    }
    
    [HttpPost("{draftId:int}/pick")]
    public async Task<ActionResult> MakePick(
        int draftId,
        MakeDraftPickRequest request)
    {
        var draft = await _context.Drafts
            .Include(d => d.Picks)
            .FirstOrDefaultAsync(d => d.Id == draftId);

        if (draft == null)
        {
            return NotFound("Draft not found.");
        }

        if (draft.IsComplete)
        {
            return BadRequest("This draft is complete.");
        }

        var player = await _context.Players
            .FirstOrDefaultAsync(p => p.Id == request.PlayerId);

        if (player == null)
        {
            return NotFound("Player not found.");
        }

        var alreadyDrafted = draft.Picks.Any(
            p => p.PlayerId == player.Id
        );

        if (alreadyDrafted)
        {
            return BadRequest(
                "This player has already been drafted."
            );
        }

        var teams = await _context.LeagueMembers
            .Where(m => m.LeagueId == draft.LeagueId)
            .OrderBy(m => m.Id)
            .ToListAsync();

        if (teams.Count == 0)
        {
            return BadRequest("This league has no teams.");
        }

        var pickIndex = draft.Picks.Count;

        var round =
            (pickIndex / teams.Count) + 1;

        var position =
            pickIndex % teams.Count;

        LeagueMember currentTeam;

        if (round % 2 == 1)
        {
            currentTeam = teams[position];
        }
        else
        {
            currentTeam =
                teams[teams.Count - 1 - position];
        }

        var pick = new DraftPick
        {
            DraftId = draft.Id,
            PlayerId = player.Id,
            LeagueMemberId = currentTeam.Id,
            PickNumber = pickIndex + 1,
            Round = round
        };

        _context.DraftPicks.Add(pick);

        await _context.SaveChangesAsync();

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
                Id = currentTeam.Id,
                Name = currentTeam.TeamName
            }
        });
    }
}

public class MakeDraftPickRequest
{
    public int PlayerId { get; set; }
}