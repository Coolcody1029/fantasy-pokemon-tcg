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

    // RegularSeason, Semifinal, Championship
    public string MatchupType { get; set; } = "RegularSeason";

    // Populated once the matchup/event has been finalized.
    public int? WinnerId { get; set; }
    public LeagueMember? Winner { get; set; }

    public bool IsFinalized { get; set; } = false;
}