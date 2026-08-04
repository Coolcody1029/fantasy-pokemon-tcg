namespace backend.Models;

public class Matchup
{
    public int Id { get; set; }

    public int LeagueId { get; set; }
    public League League { get; set; } = null!;

    public int RegionalEventId { get; set; }
    public RegionalEvent RegionalEvent { get; set; } = null!;

    public int TeamOneId { get; set; }
    public LeagueMember TeamOne { get; set; } = null!;

    public int TeamTwoId { get; set; }
    public LeagueMember TeamTwo { get; set; } = null!;
}