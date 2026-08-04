using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegionalEventsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RegionalEventsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetEvents()
    {
        var events = await _context.RegionalEvents
            .OrderBy(e => e.SeasonWeek)
            .ToListAsync();

        return Ok(events);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetEvent(int id)
    {
        var regionalEvent = await _context.RegionalEvents
            .Include(e => e.Results)
                .ThenInclude(r => r.Player)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (regionalEvent == null)
        {
            return NotFound("Regional event not found.");
        }

        return Ok(new
        {
            regionalEvent.Id,
            regionalEvent.Name,
            regionalEvent.Location,
            regionalEvent.StartDate,
            regionalEvent.SeasonWeek,
            regionalEvent.Status,

            Results = regionalEvent.Results
                .OrderBy(r => r.Placement)
                .Select(r => new
                {
                    r.Id,
                    r.Placement,
                    r.FantasyPoints,

                    Player = new
                    {
                        r.Player.Id,
                        r.Player.Name,
                        r.Player.Country,
                        r.Player.SeasonStartingRank
                    }
                })
        });
    }

    [HttpPost]
    public async Task<ActionResult> CreateEvent(
        CreateRegionalEventRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Event name is required.");
        }

        if (request.SeasonWeek <= 0)
        {
            return BadRequest("Season week must be greater than zero.");
        }

        var regionalEvent = new RegionalEvent
        {
            Name = request.Name.Trim(),
            Location = request.Location.Trim(),
            StartDate = request.StartDate,
            SeasonWeek = request.SeasonWeek
        };

        _context.RegionalEvents.Add(regionalEvent);

        await _context.SaveChangesAsync();

        return Ok(regionalEvent);
    }

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult> UpdateStatus(
    int id,
    UpdateRegionalStatusRequest request)
    {
    var regionalEvent = await _context.RegionalEvents
        .FirstOrDefaultAsync(e => e.Id == id);

    if (regionalEvent == null)
    {
        return NotFound("Regional event not found.");
    }

    var validStatuses = new[]
    {
        "Upcoming",
        "Live",
        "Final"
    };

    if (!validStatuses.Contains(request.Status))
    {
        return BadRequest(
            "Status must be Upcoming, Live, or Final."
        );
    }

    regionalEvent.Status = request.Status;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        regionalEvent.Id,
        regionalEvent.Name,
        regionalEvent.Status
    });
    }
    [HttpPost("{eventId:int}/results")]
    public async Task<ActionResult> AddResult(
        int eventId,
        AddEventResultRequest request)
    {
        var regionalEvent = await _context.RegionalEvents
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (regionalEvent == null)
        {
            return NotFound("Regional event not found.");
        }

        var player = await _context.Players
            .FirstOrDefaultAsync(p => p.Id == request.PlayerId);

        if (player == null)
        {
            return NotFound("Player not found.");
        }

        if (request.Placement <= 0)
        {
            return BadRequest("Placement must be greater than zero.");
        }

        var existingResult = await _context.EventResults
            .FirstOrDefaultAsync(r =>
                r.RegionalEventId == eventId &&
                r.PlayerId == request.PlayerId
            );

        if (existingResult != null)
        {
            return BadRequest(
                "This player already has a result for this event."
            );
        }

        var fantasyPoints =
            FantasyScoringService.CalculatePoints(
                request.Placement
            );

        var result = new EventResult
        {
            RegionalEventId = eventId,
            PlayerId = request.PlayerId,
            Placement = request.Placement,
            FantasyPoints = fantasyPoints
        };

        _context.EventResults.Add(result);

        player.FantasyPoints += fantasyPoints;

        if (request.Placement == 1)
        {
            player.RecentFinish = "1st";
        }
        else if (request.Placement == 2)
        {
            player.RecentFinish = "2nd";
        }
        else if (request.Placement == 3)
        {
            player.RecentFinish = "3rd";
        }
        else
        {
            player.RecentFinish = $"{request.Placement}th";
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            result.Id,
            result.RegionalEventId,
            result.PlayerId,
            result.Placement,
            result.FantasyPoints
        });
    }
}

public class CreateRegionalEventRequest
{
    public string Name { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public int SeasonWeek { get; set; }
}

public class AddEventResultRequest
{
    public int PlayerId { get; set; }

    public int Placement { get; set; }
}

public class UpdateRegionalStatusRequest
{
    public string Status { get; set; } = string.Empty;
}