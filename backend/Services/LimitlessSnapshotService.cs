using System.Text.Json;
using AngleSharp;
using AngleSharp.Dom;

namespace backend.Services;

public class LimitlessSnapshotService
{
    private readonly HttpClient _httpClient;
    private readonly IWebHostEnvironment _environment;

    public LimitlessSnapshotService(
        HttpClient httpClient,
        IWebHostEnvironment environment)
    {
        _httpClient = httpClient;
        _environment = environment;
    }

    public async Task<List<SeasonPlayerSeed>> CreateSnapshotAsync()
    {
        var players = new List<SeasonPlayerSeed>();
        var seenExternalIds = new HashSet<string>();

        var poolOrder = 1;

        // Keep fetching pages until we have 150 unique players.
        for (
            var page = 1;
            page <= 10 && players.Count < 150;
            page++
        )
        {
            var url =
                $"https://limitlesstcg.com/players?page={page}";

            var html =
                await _httpClient.GetStringAsync(url);

            var config =
                Configuration.Default;

            var context =
                BrowsingContext.New(config);

            var document =
                await context.OpenAsync(request =>
                    request.Content(html)
                );

            var rows =
                document.QuerySelectorAll("table tbody tr");

            foreach (var row in rows)
            {
                if (players.Count >= 150)
                {
                    break;
                }

                var cells =
                    row.QuerySelectorAll("td");

                if (cells.Length < 4)
                {
                    continue;
                }

                var rankText =
                    cells[0].TextContent.Trim();

                if (!int.TryParse(
                        rankText,
                        out var displayedRank))
                {
                    continue;
                }

                var playerLink =
                    cells[1].QuerySelector("a");

                if (playerLink == null)
                {
                    continue;
                }

                var name =
                    playerLink.TextContent.Trim();

                var href =
                    playerLink.GetAttribute("href") ?? "";

                var externalId =
                    ExtractPlayerId(href);

                // Skip duplicate Limitless player IDs.
                if (
                    !string.IsNullOrWhiteSpace(externalId) &&
                    !seenExternalIds.Add(externalId)
                )
                {
                    continue;
                }

                var country =
                    ExtractCountry(cells);

                var pointsText =
                    cells[^1]
                        .TextContent
                        .Trim()
                        .Replace(",", "");

                if (!int.TryParse(
                        pointsText,
                        out var limitlessPoints))
                {
                    limitlessPoints = 0;
                }

                players.Add(
                    new SeasonPlayerSeed
                    {
                        Name = name,
                        Country = country,
                        SeasonStartingRank =
                            displayedRank,
                        SeasonPoolOrder =
                            poolOrder,
                        LimitlessPoints =
                            limitlessPoints,
                        ExternalId =
                            externalId
                    }
                );

                poolOrder++;
            }

            if (players.Count >= 150)
            {
                break;
            }

            await Task.Delay(500);
        }

        if (players.Count != 150)
        {
            throw new InvalidOperationException(
                $"Expected 150 unique Limitless players but found {players.Count}."
            );
        }

        await SaveSnapshotAsync(players);

        return players;
    }

    private async Task SaveSnapshotAsync(
        List<SeasonPlayerSeed> players)
    {
        var directory =
            Path.Combine(
                _environment.ContentRootPath,
                "Data",
                "Seed"
            );

        Directory.CreateDirectory(directory);

        var filePath =
            Path.Combine(
                directory,
                "season-players.json"
            );

        var json =
            JsonSerializer.Serialize(
                players,
                new JsonSerializerOptions
                {
                    WriteIndented = true
                }
            );

        await File.WriteAllTextAsync(
            filePath,
            json
        );
    }

    private static string? ExtractPlayerId(
        string href)
    {
        if (string.IsNullOrWhiteSpace(href))
        {
            return null;
        }

        var parts =
            href
                .TrimEnd('/')
                .Split('/');

        var lastPart =
            parts.LastOrDefault();

        return string.IsNullOrWhiteSpace(lastPart)
            ? null
            : lastPart;
    }

    private static string ExtractCountry(
        IHtmlCollection<IElement> cells)
    {
        foreach (var cell in cells)
        {
            var image =
                cell.QuerySelector("img");

            if (image == null)
            {
                continue;
            }

            var alt =
                image.GetAttribute("alt");

            if (!string.IsNullOrWhiteSpace(alt))
            {
                return alt
                    .Replace("Image:", "")
                    .Trim();
            }

            var title =
                image.GetAttribute("title");

            if (!string.IsNullOrWhiteSpace(title))
            {
                return title.Trim();
            }

            var src =
                image.GetAttribute("src");

            if (!string.IsNullOrWhiteSpace(src))
            {
                var fileName =
                    Path.GetFileNameWithoutExtension(src);

                if (!string.IsNullOrWhiteSpace(fileName) &&
                    fileName.Length <= 3)
                {
                    return fileName.ToUpper();
                }
            }
        }

        return "";
    }
}