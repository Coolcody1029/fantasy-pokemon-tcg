namespace backend.Models;

public class RegionalLineupEntry
{
    public int Id { get; set; }

    public int LeagueMemberId { get; set; }

    public LeagueMember LeagueMember { get; set; } = null!;

    public int RegionalEventId { get; set; }

    public RegionalEvent RegionalEvent { get; set; } = null!;

    public int PlayerId { get; set; }

    public Player Player { get; set; } = null!;
}