using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Don't seed again if players already exist.
        if (await context.Players.AnyAsync())
        {
            return;
        }

        var players = new List<Player>
        {
            new()
            {
                Name = "Tord Reklev",
                Country = "Norway",
                SeasonStartingRank = 1,
                ExternalId = null,
                FantasyPoints = 0,
                RecentFinish = "",
                IsActiveForSeason = true
            },

            new()
            {
                Name = "Azul Garcia Griego",
                Country = "United States",
                SeasonStartingRank = 2,
                ExternalId = null,
                FantasyPoints = 0,
                RecentFinish = "",
                IsActiveForSeason = true
            },

            new()
            {
                Name = "Isaiah Bradner",
                Country = "United States",
                SeasonStartingRank = 3,
                ExternalId = null,
                FantasyPoints = 0,
                RecentFinish = "",
                IsActiveForSeason = true
            },

            new()
            {
                Name = "Rahul Reddy",
                Country = "United States",
                SeasonStartingRank = 4,
                ExternalId = null,
                FantasyPoints = 0,
                RecentFinish = "",
                IsActiveForSeason = true
            }
        };

        context.Players.AddRange(players);

        await context.SaveChangesAsync();
    }
}