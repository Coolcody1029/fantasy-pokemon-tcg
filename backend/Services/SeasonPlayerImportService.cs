using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class SeasonPlayerImportService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public SeasonPlayerImportService(
        AppDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

public async Task<int> ImportAsync()
{
    var filePath = Path.Combine(
        _environment.ContentRootPath,
        "Data",
        "Seed",
        "season-players.json"
    );

    if (!File.Exists(filePath))
    {
        throw new FileNotFoundException(
            "Season player file was not found.",
            filePath
        );
    }

    var json = await File.ReadAllTextAsync(filePath);

    var players = JsonSerializer.Deserialize<List<SeasonPlayerSeed>>(
        json,
        new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }
    );

    if (players == null || players.Count == 0)
    {
        throw new InvalidOperationException(
            "Season player file contains no players."
        );
    }

    var duplicatePoolOrder = players
        .GroupBy(p => p.SeasonPoolOrder)
        .FirstOrDefault(group => group.Count() > 1);

    if (duplicatePoolOrder != null)
    {
        throw new InvalidOperationException(
            $"Duplicate season pool order: {duplicatePoolOrder.Key}"
        );
    }

    var duplicateExternalId = players
        .Where(p => !string.IsNullOrWhiteSpace(p.ExternalId))
        .GroupBy(p => p.ExternalId)
        .FirstOrDefault(group => group.Count() > 1);

    if (duplicateExternalId != null)
    {
        throw new InvalidOperationException(
            $"Duplicate Limitless ID: {duplicateExternalId.Key}"
        );
    }

    var allExistingPlayers =
        await _context.Players.ToListAsync();

    // Freeze out anyone who isn't in this season's snapshot.
    foreach (var existing in allExistingPlayers)
    {
        existing.IsActiveForSeason = false;
    }

    foreach (var playerSeed in players)
    {
        Player? existingPlayer = null;

        // Best identifier: Limitless ID
        if (!string.IsNullOrWhiteSpace(playerSeed.ExternalId))
        {
            existingPlayer = allExistingPlayers
                .FirstOrDefault(p =>
                    p.ExternalId == playerSeed.ExternalId
                );
        }

        // Temporary fallback while we're still building the snapshot.
        if (existingPlayer == null)
        {
            existingPlayer = allExistingPlayers
                .FirstOrDefault(p =>
                    p.Name.ToLower() ==
                        playerSeed.Name.ToLower() &&
                    p.Country.ToLower() ==
                        playerSeed.Country.ToLower()
                );
        }

        if (existingPlayer != null)
        {
            existingPlayer.Name =
                playerSeed.Name;

            existingPlayer.Country =
                playerSeed.Country;

            existingPlayer.SeasonStartingRank =
                playerSeed.SeasonStartingRank;

            existingPlayer.SeasonPoolOrder =
                playerSeed.SeasonPoolOrder;

            existingPlayer.LimitlessPoints =
                playerSeed.LimitlessPoints;

            existingPlayer.ExternalId =
                playerSeed.ExternalId;

            existingPlayer.FantasyPoints = 0;
            existingPlayer.RecentFinish = "";
            existingPlayer.IsActiveForSeason = true;

            continue;
        }

        _context.Players.Add(
            new Player
            {
                Name =
                    playerSeed.Name,

                Country =
                    playerSeed.Country,

                SeasonStartingRank =
                    playerSeed.SeasonStartingRank,

                SeasonPoolOrder =
                    playerSeed.SeasonPoolOrder,

                LimitlessPoints =
                    playerSeed.LimitlessPoints,

                ExternalId =
                    playerSeed.ExternalId,

                FantasyPoints = 0,
                RecentFinish = "",
                IsActiveForSeason = true
            }
        );
    }

    await _context.SaveChangesAsync();

    return players.Count;
}

}
