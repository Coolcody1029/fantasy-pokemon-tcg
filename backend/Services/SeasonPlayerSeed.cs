namespace backend.Services;

public class SeasonPlayerSeed
{
    public string Name { get; set; } = string.Empty;

    public string Country { get; set; } = string.Empty;

    public int SeasonStartingRank { get; set; }

    public int SeasonPoolOrder { get; set; }

    public int LimitlessPoints { get; set; }

    public string? ExternalId { get; set; }
}