using AngleSharp;
using AngleSharp.Dom;

namespace backend.Services;

public class LimitlessResultsService
{
    private readonly HttpClient _httpClient;

    public LimitlessResultsService(
        HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    /*
     * Downloads a Limitless tournament page
     * and extracts player placements.
     *
     * Example result:
     *
     * ExternalId = "12345"
     * Name = "Player Name"
     * Placement = 1
     */
    public async Task<List<LimitlessTournamentResult>>
        GetTournamentResultsAsync(
            string tournamentUrl)
    {
        if (
            string.IsNullOrWhiteSpace(
                tournamentUrl
            )
        )
        {
            throw new ArgumentException(
                "Tournament URL is required.",
                nameof(tournamentUrl)
            );
        }

        if (
            !Uri.TryCreate(
                tournamentUrl,
                UriKind.Absolute,
                out var uri
            )
        )
        {
            throw new ArgumentException(
                "Tournament URL is invalid.",
                nameof(tournamentUrl)
            );
        }

        /*
         * Only allow Limitless URLs.
         */
        if (
            !uri.Host.EndsWith(
                "limitlesstcg.com",
                StringComparison.OrdinalIgnoreCase
            )
        )
        {
            throw new ArgumentException(
                "Tournament URL must be from Limitless TCG.",
                nameof(tournamentUrl)
            );
        }

        var html =
            await _httpClient.GetStringAsync(
                tournamentUrl
            );

        var config =
            Configuration.Default;

        var context =
            BrowsingContext.New(config);

        var document =
            await context.OpenAsync(
                request =>
                    request.Content(html)
            );

        /*
         * Tournament pages generally expose
         * standings/results in table rows.
         *
         * We intentionally inspect all tables
         * rather than relying on one CSS class.
         */
        var rows =
            document.QuerySelectorAll(
                "table tbody tr"
            );

        var results =
            new List<LimitlessTournamentResult>();

        var seenPlayerIds =
            new HashSet<string>();

        foreach (var row in rows)
        {
            var cells =
                row.QuerySelectorAll("td");

            if (cells.Length < 2)
            {
                continue;
            }

            /*
             * Find a numeric placement.
             *
             * Usually this is the first column,
             * but we scan the first few cells
             * so small markup changes don't
             * immediately break the importer.
             */
            int? placement = null;

            for (
                var cellIndex = 0;
                cellIndex <
                    Math.Min(
                        cells.Length,
                        3
                    );
                cellIndex++
            )
            {
                var text =
                    cells[cellIndex]
                        .TextContent
                        .Trim();

                if (
                    TryParsePlacement(
                        text,
                        out var parsedPlacement
                    )
                )
                {
                    placement =
                        parsedPlacement;

                    break;
                }
            }

            if (placement == null)
            {
                continue;
            }

            /*
             * Find a player profile link.
             *
             * Your frozen Top 150 snapshot also
             * gets ExternalId from /players/...
             * profile links, so this gives us
             * stable matching.
             */
            var playerLink =
                row.QuerySelector(
                    "a[href*='/players/']"
                );

            if (playerLink == null)
            {
                continue;
            }

            var href =
                playerLink.GetAttribute(
                    "href"
                );

            var externalId =
                ExtractPlayerId(
                    href
                );

            if (
                string.IsNullOrWhiteSpace(
                    externalId
                )
            )
            {
                continue;
            }

            /*
             * A standings page can sometimes
             * contain repeated player links.
             */
            if (
                !seenPlayerIds.Add(
                    externalId
                )
            )
            {
                continue;
            }

            var name =
                playerLink.TextContent
                    .Trim();

            if (
                string.IsNullOrWhiteSpace(
                    name
                )
            )
            {
                continue;
            }

            results.Add(
                new LimitlessTournamentResult
                {
                    ExternalId =
                        externalId,

                    Name =
                        name,

                    Placement =
                        placement.Value
                }
            );
        }

        if (results.Count == 0)
        {
            throw new InvalidOperationException(
                "No tournament standings could be found on the supplied Limitless page."
            );
        }

        return results
            .OrderBy(result =>
                result.Placement
            )
            .ToList();
    }

    private static bool TryParsePlacement(
        string text,
        out int placement)
    {
        placement = 0;

        if (
            string.IsNullOrWhiteSpace(
                text
            )
        )
        {
            return false;
        }

        /*
         * Support:
         *
         * 1
         * 1st
         * 2nd
         * 33rd
         * #16
         */
        var cleaned =
            text
                .Trim()
                .TrimStart('#')
                .ToLowerInvariant();

        cleaned =
            cleaned
                .Replace("st", "")
                .Replace("nd", "")
                .Replace("rd", "")
                .Replace("th", "");

        if (
            !int.TryParse(
                cleaned,
                out placement
            )
        )
        {
            placement = 0;
            return false;
        }

        return placement > 0;
    }

    private static string? ExtractPlayerId(
        string? href)
    {
        if (
            string.IsNullOrWhiteSpace(
                href
            )
        )
        {
            return null;
        }

        var cleanHref =
            href.Split(
                '?',
                '#'
            )[0];

        var parts =
            cleanHref
                .TrimEnd('/')
                .Split(
                    '/',
                    StringSplitOptions
                        .RemoveEmptyEntries
                );

        /*
         * Find:
         *
         * /players/ABC123
         *
         * instead of simply trusting the
         * final URL segment.
         */
        for (
            var index = 0;
            index < parts.Length - 1;
            index++
        )
        {
            if (
                parts[index].Equals(
                    "players",
                    StringComparison
                        .OrdinalIgnoreCase
                )
            )
            {
                return parts[
                    index + 1
                ];
            }
        }

        return null;
    }
}

public class LimitlessTournamentResult
{
    public string ExternalId { get; set; } =
        string.Empty;

    public string Name { get; set; } =
        string.Empty;

    public int Placement { get; set; }
}