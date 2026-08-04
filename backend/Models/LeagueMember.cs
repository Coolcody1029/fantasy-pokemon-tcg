using System.Text.Json.Serialization;

namespace backend.Models;

public class LeagueMember
{
    public int Id { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public int LeagueId { get; set; }

    [JsonIgnore]
    public League League { get; set; } = null!;

    public bool IsCommissioner { get; set; }
}