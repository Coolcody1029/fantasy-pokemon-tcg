namespace backend.Models;

public class League
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string InviteCode { get; set; } = string.Empty;

    public int MaxTeams { get; set; } = 8;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<LeagueMember> Members { get; set; } = new();
}