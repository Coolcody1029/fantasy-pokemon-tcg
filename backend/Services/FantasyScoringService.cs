namespace backend.Services;

public static class FantasyScoringService
{
    public static int CalculatePoints(int placement)
    {
        return placement switch
        {
            1 => 35,
            2 => 32,
            <= 4 => 30,
            <= 8 => 28,
            <= 16 => 20,
            <= 32 => 16,
            <= 64 => 12,
            <= 128 => 8,
            <= 256 => 6,
            <= 512 => 4,
            <= 1024 => 2,
            _ => 0
        };
    }
}