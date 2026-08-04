namespace backend.Models;

public class DraftPick
{
    public int Id { get; set; }

    public int DraftId { get; set; }

    public Draft Draft { get; set; } = null!;

    public int PlayerId { get; set; }

    public Player Player { get; set; } = null!;

    public int LeagueMemberId { get; set; }

    public LeagueMember LeagueMember { get; set; } = null!;

    public int PickNumber { get; set; }

    public int Round { get; set; }

    public DateTime PickedAt { get; set; } = DateTime.UtcNow;
}