namespace backend.Models;

public class Player
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Country { get; set; } = string.Empty;

    // Rank displayed by Limitless. Ties are allowed.
    public int SeasonStartingRank { get; set; }

    // Unique position in our frozen Top 150 snapshot.
    public int SeasonPoolOrder { get; set; }

    public int LimitlessPoints { get; set; }

    // Unique Limitless player identifier.
    public string? ExternalId { get; set; }

    public decimal FantasyPoints { get; set; }

    public string RecentFinish { get; set; } = string.Empty;

    public bool IsActiveForSeason { get; set; } = true;
}