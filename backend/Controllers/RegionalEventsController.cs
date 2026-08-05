using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegionalEventsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly LimitlessResultsService _limitlessResultsService;

    public RegionalEventsController(
        AppDbContext context,
        LimitlessResultsService limitlessResultsService)
    {
        _context = context;
        _limitlessResultsService = limitlessResultsService;
    }

    /*
     * Get every Regional.
     */
    [HttpGet]
    public async Task<ActionResult> GetEvents()
    {
        var events = await _context.RegionalEvents
            .OrderBy(e => e.SeasonWeek)
            .ToListAsync();

        return Ok(events);
    }

    /*
     * Get one Regional and all currently
     * stored fantasy-relevant results.
     */
    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetEvent(int id)
    {
        var regionalEvent = await _context.RegionalEvents
            .Include(e => e.Results)
                .ThenInclude(r => r.Player)
            .FirstOrDefaultAsync(e =>
                e.Id == id
            );

        if (regionalEvent == null)
        {
            return NotFound(
                "Regional event not found."
            );
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
                        r.Player.ExternalId,
                        r.Player.SeasonStartingRank
                    }
                })
        });
    }

    /*
     * Create a Regional.
     *
     * Currently requires authentication.
     * Later this can become app-admin-only.
     */
    [Authorize]
    [HttpPost]
    public async Task<ActionResult> CreateEvent(
        CreateRegionalEventRequest request)
    {
        if (
            string.IsNullOrWhiteSpace(
                request.Name
            )
        )
        {
            return BadRequest(
                "Event name is required."
            );
        }

        if (request.SeasonWeek <= 0)
        {
            return BadRequest(
                "Season week must be greater than zero."
            );
        }

        var weekExists =
            await _context.RegionalEvents
                .AnyAsync(e =>
                    e.SeasonWeek ==
                    request.SeasonWeek
                );

        if (weekExists)
        {
            return BadRequest(
                "A Regional already exists for this season week."
            );
        }

        var regionalEvent =
            new RegionalEvent
            {
                Name =
                    request.Name.Trim(),

                Location =
                    request.Location.Trim(),

                StartDate =
                    request.StartDate,

                SeasonWeek =
                    request.SeasonWeek,

                Status =
                    "Upcoming"
            };

        _context.RegionalEvents.Add(
            regionalEvent
        );

        await _context.SaveChangesAsync();

        return Ok(regionalEvent);
    }

    /*
     * Regional lifecycle:
     *
     * Upcoming -> Live -> Final
     */
    [Authorize]
    [HttpPut("{id:int}/status")]
    public async Task<ActionResult> UpdateStatus(
        int id,
        UpdateRegionalStatusRequest request)
    {
        var regionalEvent =
            await _context.RegionalEvents
                .FirstOrDefaultAsync(e =>
                    e.Id == id
                );

        if (regionalEvent == null)
        {
            return NotFound(
                "Regional event not found."
            );
        }

        var normalizedStatus =
            request.Status.Trim();

        var validStatuses =
            new[]
            {
                "Upcoming",
                "Live",
                "Final"
            };

        if (
            !validStatuses.Contains(
                normalizedStatus
            )
        )
        {
            return BadRequest(
                "Status must be Upcoming, Live, or Final."
            );
        }

        var statusOrder =
            new Dictionary<string, int>
            {
                ["Upcoming"] = 0,
                ["Live"] = 1,
                ["Final"] = 2
            };

        if (
            !statusOrder.TryGetValue(
                regionalEvent.Status,
                out var currentStatusValue
            )
        )
        {
            return BadRequest(
                "The Regional currently has an invalid status."
            );
        }

        var requestedStatusValue =
            statusOrder[
                normalizedStatus
            ];

        if (
            requestedStatusValue <
            currentStatusValue
        )
        {
            return BadRequest(
                "A Regional cannot move backward to an earlier status."
            );
        }

        regionalEvent.Status =
            normalizedStatus;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            regionalEvent.Id,
            regionalEvent.Name,
            regionalEvent.Status
        });
    }

    /*
     * Add one result manually.
     *
     * Fantasy points are always calculated
     * by the backend.
     */
    [Authorize]
    [HttpPost("{eventId:int}/results")]
    public async Task<ActionResult> AddResult(
        int eventId,
        AddEventResultRequest request)
    {
        var regionalEvent =
            await _context.RegionalEvents
                .FirstOrDefaultAsync(e =>
                    e.Id == eventId
                );

        if (regionalEvent == null)
        {
            return NotFound(
                "Regional event not found."
            );
        }

        if (
            regionalEvent.Status ==
            "Upcoming"
        )
        {
            return BadRequest(
                "Results cannot be added while the Regional is still Upcoming."
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

        if (request.Placement <= 0)
        {
            return BadRequest(
                "Placement must be greater than zero."
            );
        }

        var existingResult =
            await _context.EventResults
                .FirstOrDefaultAsync(r =>
                    r.RegionalEventId ==
                        eventId &&
                    r.PlayerId ==
                        request.PlayerId
                );

        if (existingResult != null)
        {
            return BadRequest(
                "This player already has a result for this event."
            );
        }

        var fantasyPoints =
            FantasyScoringService
                .CalculatePoints(
                    request.Placement
                );

        var result =
            new EventResult
            {
                RegionalEventId =
                    eventId,

                PlayerId =
                    request.PlayerId,

                Placement =
                    request.Placement,

                FantasyPoints =
                    fantasyPoints
            };

        _context.EventResults.Add(
            result
        );

        await _context.SaveChangesAsync();

        /*
         * Rebuild the player's season total
         * from EventResults.
         */
        await RecalculatePlayerSummary(
            player.Id
        );

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

    /*
     * BULK RESULT IMPORT
     *
     * Allows manual/API bulk result importing.
     *
     * Can resolve a player using:
     *
     * PlayerId
     * OR
     * Limitless ExternalId
     *
     * Existing EventResults are updated instead
     * of duplicated.
     */
    [Authorize]
    [HttpPost("{eventId:int}/results/bulk")]
    public async Task<ActionResult> BulkImportResults(
        int eventId,
        BulkEventResultsRequest request)
    {
        var regionalEvent =
            await _context.RegionalEvents
                .FirstOrDefaultAsync(e =>
                    e.Id == eventId
                );

        if (regionalEvent == null)
        {
            return NotFound(
                "Regional event not found."
            );
        }

        if (
            regionalEvent.Status ==
            "Upcoming"
        )
        {
            return BadRequest(
                "Results cannot be imported while the Regional is still Upcoming."
            );
        }

        if (
            request.Results == null ||
            request.Results.Count == 0
        )
        {
            return BadRequest(
                "At least one result is required."
            );
        }

        /*
         * Validate the request before touching
         * EventResult records.
         */
        foreach (
            var item in
            request.Results
        )
        {
            if (item.Placement <= 0)
            {
                return BadRequest(
                    "Every placement must be greater than zero."
                );
            }

            if (
                item.PlayerId == null &&
                string.IsNullOrWhiteSpace(
                    item.ExternalId
                )
            )
            {
                return BadRequest(
                    "Every result must include either PlayerId or ExternalId."
                );
            }
        }

        var players =
            await _context.Players
                .ToListAsync();

        var existingResults =
            await _context.EventResults
                .Where(result =>
                    result.RegionalEventId ==
                    eventId
                )
                .ToListAsync();

        var resolvedResults =
            new List<ResolvedBulkResult>();

        var unresolved =
            new List<object>();

        var seenPlayerIds =
            new HashSet<int>();

        foreach (
            var item in
            request.Results
        )
        {
            Player? player = null;

            /*
             * Prefer stable Limitless ID.
             */
            if (
                !string.IsNullOrWhiteSpace(
                    item.ExternalId
                )
            )
            {
                var externalId =
                    item.ExternalId.Trim();

                player =
                    players.FirstOrDefault(
                        p =>
                            p.ExternalId ==
                            externalId
                    );
            }

            /*
             * Internal ID fallback.
             */
            if (
                player == null &&
                item.PlayerId != null
            )
            {
                player =
                    players.FirstOrDefault(
                        p =>
                            p.Id ==
                            item.PlayerId.Value
                    );
            }

            if (player == null)
            {
                unresolved.Add(new
                {
                    item.PlayerId,
                    item.ExternalId,
                    item.Placement,

                    Reason =
                        "No matching fantasy player was found."
                });

                continue;
            }

            if (
                !seenPlayerIds.Add(
                    player.Id
                )
            )
            {
                return BadRequest(
                    $"Player {player.Name} appears more than once in the import."
                );
            }

            resolvedResults.Add(
                new ResolvedBulkResult
                {
                    Player =
                        player,

                    Placement =
                        item.Placement
                }
            );
        }

        if (
            resolvedResults.Count == 0
        )
        {
            return BadRequest(new
            {
                Message =
                    "None of the supplied results matched players in the fantasy pool.",

                Unresolved =
                    unresolved
            });
        }

        var inserted = 0;
        var updated = 0;

        var affectedPlayerIds =
            new HashSet<int>();

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            foreach (
                var resolved in
                resolvedResults
            )
            {
                var player =
                    resolved.Player;

                var fantasyPoints =
                    FantasyScoringService
                        .CalculatePoints(
                            resolved.Placement
                        );

                var existingResult =
                    existingResults
                        .FirstOrDefault(
                            result =>
                                result.PlayerId ==
                                player.Id
                        );

                if (existingResult == null)
                {
                    var result =
                        new EventResult
                        {
                            RegionalEventId =
                                eventId,

                            PlayerId =
                                player.Id,

                            Placement =
                                resolved.Placement,

                            FantasyPoints =
                                fantasyPoints
                        };

                    _context.EventResults.Add(
                        result
                    );

                    existingResults.Add(
                        result
                    );

                    inserted++;
                }
                else
                {
                    existingResult.Placement =
                        resolved.Placement;

                    existingResult.FantasyPoints =
                        fantasyPoints;

                    updated++;
                }

                affectedPlayerIds.Add(
                    player.Id
                );
            }

            await _context.SaveChangesAsync();

            foreach (
                var playerId in
                affectedPlayerIds
            )
            {
                await RecalculatePlayerSummary(
                    playerId
                );
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return Ok(new
        {
            EventId =
                regionalEvent.Id,

            Event =
                regionalEvent.Name,

            Received =
                request.Results.Count,

            Matched =
                resolvedResults.Count,

            Inserted =
                inserted,

            Updated =
                updated,

            UnresolvedCount =
                unresolved.Count,

            Unresolved =
                unresolved,

            Message =
                "Regional results imported successfully."
        });
    }

    /*
     * LIMITLESS IMPORT
     *
     * Give the API a Limitless tournament URL.
     *
     * The backend:
     *
     * 1. Downloads the standings.
     * 2. Reads placement + Limitless player ID.
     * 3. Matches those IDs against our Top 150.
     * 4. Calculates fantasy points.
     * 5. Creates or updates EventResults.
     * 6. Recalculates player season totals.
     *
     * It is safe to run this multiple times.
     */
    [Authorize]
    [HttpPost(
        "{eventId:int}/results/import-limitless"
    )]
    public async Task<ActionResult>
        ImportLimitlessResults(
            int eventId,
            ImportLimitlessResultsRequest request)
    {
        var regionalEvent =
            await _context.RegionalEvents
                .FirstOrDefaultAsync(
                    regional =>
                        regional.Id ==
                        eventId
                );

        if (regionalEvent == null)
        {
            return NotFound(
                "Regional event not found."
            );
        }

        /*
         * Lineups should already be locked
         * before results begin flowing.
         */
        if (
            regionalEvent.Status ==
            "Upcoming"
        )
        {
            return BadRequest(
                "The Regional must be Live or Final before results can be imported."
            );
        }

        if (
            string.IsNullOrWhiteSpace(
                request.Url
            )
        )
        {
            return BadRequest(
                "A Limitless tournament URL is required."
            );
        }

        List<LimitlessTournamentResult>
            limitlessResults;

        try
        {
            limitlessResults =
                await _limitlessResultsService
                    .GetTournamentResultsAsync(
                        request.Url.Trim()
                    );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                Message =
                    "The supplied Limitless URL is invalid.",

                Error =
                    ex.Message
            });
        }
        catch (HttpRequestException ex)
        {
            return BadRequest(new
            {
                Message =
                    "Limitless could not be reached.",

                Error =
                    ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                Message =
                    "No usable tournament standings could be found on the Limitless page.",

                Error =
                    ex.Message
            });
        }

        /*
         * Only players in the frozen fantasy
         * pool matter for scoring.
         */
        var fantasyPlayers =
            await _context.Players
                .Where(player =>
                    player.IsActiveForSeason
                )
                .ToListAsync();

        /*
         * ExternalId is the primary bridge
         * between Limitless and our database.
         */
        var playerByExternalId =
            fantasyPlayers
                .Where(player =>
                    !string.IsNullOrWhiteSpace(
                        player.ExternalId
                    )
                )
                .GroupBy(player =>
                    player.ExternalId!
                )
                .ToDictionary(
                    group =>
                        group.Key,

                    group =>
                        group.First()
                );

        var existingResults =
            await _context.EventResults
                .Where(result =>
                    result.RegionalEventId ==
                    eventId
                )
                .ToListAsync();

        var inserted = 0;
        var updated = 0;
        var ignored = 0;

        var affectedPlayerIds =
            new HashSet<int>();

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            foreach (
                var limitlessResult in
                limitlessResults
            )
            {
                if (
                    !playerByExternalId
                        .TryGetValue(
                            limitlessResult.ExternalId,
                            out var player
                        )
                )
                {
                    /*
                     * They competed in the Regional
                     * but are not part of our fantasy
                     * Top 150.
                     */
                    ignored++;
                    continue;
                }

                var fantasyPoints =
                    FantasyScoringService
                        .CalculatePoints(
                            limitlessResult.Placement
                        );

                var existingResult =
                    existingResults
                        .FirstOrDefault(
                            result =>
                                result.PlayerId ==
                                player.Id
                        );

                if (existingResult == null)
                {
                    var eventResult =
                        new EventResult
                        {
                            RegionalEventId =
                                eventId,

                            PlayerId =
                                player.Id,

                            Placement =
                                limitlessResult.Placement,

                            FantasyPoints =
                                fantasyPoints
                        };

                    _context.EventResults.Add(
                        eventResult
                    );

                    /*
                     * Add to our in-memory list too,
                     * so duplicate rows in one import
                     * cannot create duplicate DB rows.
                     */
                    existingResults.Add(
                        eventResult
                    );

                    inserted++;
                }
                else
                {
                    /*
                     * Limitless results can change
                     * while the tournament is Live.
                     *
                     * Update instead of duplicating.
                     */
                    existingResult.Placement =
                        limitlessResult.Placement;

                    existingResult.FantasyPoints =
                        fantasyPoints;

                    updated++;
                }

                affectedPlayerIds.Add(
                    player.Id
                );
            }

            await _context.SaveChangesAsync();

            /*
             * Recalculate cached season totals
             * from EventResult source data.
             */
            foreach (
                var playerId in
                affectedPlayerIds
            )
            {
                await RecalculatePlayerSummary(
                    playerId
                );
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return Ok(new
        {
            EventId =
                regionalEvent.Id,

            Event =
                regionalEvent.Name,

            LimitlessResultsFound =
                limitlessResults.Count,

            FantasyPlayersMatched =
                affectedPlayerIds.Count,

            Inserted =
                inserted,

            Updated =
                updated,

            Ignored =
                ignored,

            Message =
                "Limitless results imported successfully."
        });
    }

    /*
     * Rebuild Player.FantasyPoints using
     * EventResult as the source of truth.
     *
     * This makes imports idempotent.
     */
    private async Task RecalculatePlayerSummary(
        int playerId)
    {
        var player =
            await _context.Players
                .FirstOrDefaultAsync(p =>
                    p.Id == playerId
                );

        if (player == null)
        {
            return;
        }

        var results =
            await _context.EventResults
                .Where(result =>
                    result.PlayerId ==
                    playerId
                )
                .Include(result =>
                    result.RegionalEvent
                )
                .ToListAsync();

        player.FantasyPoints =
            results.Sum(
                result =>
                    (decimal)
                    result.FantasyPoints
            );

        /*
         * Display the most recent tournament
         * finish on the player's card.
         */
        var latestResult =
            results
                .OrderByDescending(
                    result =>
                        result
                            .RegionalEvent
                            .StartDate
                )
                .ThenByDescending(
                    result =>
                        result
                            .RegionalEvent
                            .SeasonWeek
                )
                .FirstOrDefault();

        player.RecentFinish =
            latestResult == null
                ? string.Empty
                : FormatPlacement(
                    latestResult.Placement
                );
    }

    /*
     * Correctly formats:
     *
     * 1st
     * 2nd
     * 3rd
     * 4th
     * 11th
     * 12th
     * 13th
     * 21st
     * 22nd
     * 23rd
     */
    private static string FormatPlacement(
        int placement)
    {
        var lastTwoDigits =
            placement % 100;

        if (
            lastTwoDigits >= 11 &&
            lastTwoDigits <= 13
        )
        {
            return $"{placement}th";
        }

        return (
            placement % 10
        ) switch
        {
            1 =>
                $"{placement}st",

            2 =>
                $"{placement}nd",

            3 =>
                $"{placement}rd",

            _ =>
                $"{placement}th"
        };
    }

    /*
     * Internal helper for manual
     * bulk imports.
     */
    private class ResolvedBulkResult
    {
        public Player Player { get; set; } =
            null!;

        public int Placement { get; set; }
    }
}

/*
 * REQUEST DTOs
 */

public class CreateRegionalEventRequest
{
    public string Name { get; set; } =
        string.Empty;

    public string Location { get; set; } =
        string.Empty;

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
    public string Status { get; set; } =
        string.Empty;
}

public class BulkEventResultsRequest
{
    public List<BulkEventResultItemRequest>
        Results { get; set; } = new();
}

public class BulkEventResultItemRequest
{
    /*
     * Useful for manual/testing imports.
     */
    public int? PlayerId { get; set; }

    /*
     * Preferred Limitless identifier.
     */
    public string? ExternalId { get; set; }

    public int Placement { get; set; }
}

public class ImportLimitlessResultsRequest
{
    public string Url { get; set; } =
        string.Empty;
}