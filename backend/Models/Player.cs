namespace backend.Models;

public class Player
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Country { get; set; } = string.Empty;

    public int SeasonStartingRank { get; set; }

    public string? ExternalId { get; set; }

    public decimal FantasyPoints { get; set; }

    public string RecentFinish { get; set; } = string.Empty;

    public bool IsActiveForSeason { get; set; } = true;
}