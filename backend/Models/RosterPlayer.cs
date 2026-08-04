namespace backend.Models;

public class RosterPlayer
{
    public int Id { get; set; }

    public int LeagueMemberId { get; set; }

    public LeagueMember LeagueMember { get; set; } = null!;

    public int PlayerId { get; set; }

    public Player Player { get; set; } = null!;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}