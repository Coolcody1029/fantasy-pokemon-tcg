using System.Text.Json.Serialization;

namespace backend.Models;

public class LeagueMember
{
    public int Id { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public int LeagueId { get; set; }

    [JsonIgnore]
    public League League { get; set; } = null!;

    public int? UserId { get; set; }

    [JsonIgnore]
    public User? User { get; set; }

    public bool IsCommissioner { get; set; }
}