namespace backend.Models;

public class RegionalEvent
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public int SeasonWeek { get; set; }

    public List<EventResult> Results { get; set; } = new();

    public string Status { get; set; } = "Upcoming";
}