namespace backend.Models;

public class EventResult
{
    public int Id { get; set; }

    public int RegionalEventId { get; set; }

    public RegionalEvent RegionalEvent { get; set; } = null!;

    public int PlayerId { get; set; }

    public Player Player { get; set; } = null!;

    public int Placement { get; set; }

    public int FantasyPoints { get; set; }
}