using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Player> Players => Set<Player>();

    public DbSet<League> Leagues => Set<League>();

    public DbSet<LeagueMember> LeagueMembers =>
    Set<LeagueMember>();

    public DbSet<Draft> Drafts => Set<Draft>();

    public DbSet<DraftPick> DraftPicks => Set<DraftPick>();

}

