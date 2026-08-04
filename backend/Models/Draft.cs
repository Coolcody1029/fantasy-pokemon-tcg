namespace backend.Models;

public class Draft
{
    public int Id { get; set; }

    public int LeagueId { get; set; }

    public League League { get; set; } = null!;

    public bool IsComplete { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<DraftPick> Picks { get; set; } = new();
}