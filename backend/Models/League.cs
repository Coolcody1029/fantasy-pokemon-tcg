namespace backend.Models;

public class League
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string InviteCode { get; set; } = string.Empty;

    public int MaxTeams { get; set; } = 8;

    /*
     * Number of teams that qualify
     * for the Fantasy TCG Playoffs.
     *
     * Default format:
     *
     * #1 vs #4
     * #2 vs #3
     */
    public int PlayoffTeamCount { get; set; } = 4;

    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;

    public List<LeagueMember> Members { get; set; } =
        new();
}