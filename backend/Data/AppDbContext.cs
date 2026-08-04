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

    public DbSet<RosterPlayer> RosterPlayers => Set<RosterPlayer>();

    public DbSet<RegionalEvent> RegionalEvents => Set<RegionalEvent>();

    public DbSet<EventResult> EventResults => Set<EventResult>();

    public DbSet<Matchup> Matchups => Set<Matchup>();

    public DbSet<User> Users => Set<User>();

    public DbSet<RegionalLineupEntry> RegionalLineupEntries =>
    Set<RegionalLineupEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<RegionalLineupEntry>()
        .HasIndex(entry => new
        {
            entry.LeagueMemberId,
            entry.RegionalEventId,
            entry.PlayerId
        })
        .IsUnique();

    modelBuilder.Entity<User>()
    .HasIndex(user => user.Email)
    .IsUnique();

    modelBuilder.Entity<User>()
    .HasIndex(user => user.Username)
    .IsUnique();
}
}

