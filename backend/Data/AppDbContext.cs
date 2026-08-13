using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(
        DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Player> Players =>
        Set<Player>();

    public DbSet<League> Leagues =>
        Set<League>();

    public DbSet<LeagueMember> LeagueMembers =>
        Set<LeagueMember>();

    public DbSet<Draft> Drafts =>
        Set<Draft>();

    public DbSet<DraftPick> DraftPicks =>
        Set<DraftPick>();

    public DbSet<RosterPlayer> RosterPlayers =>
        Set<RosterPlayer>();

    public DbSet<RegionalEvent> RegionalEvents =>
        Set<RegionalEvent>();

    public DbSet<EventResult> EventResults =>
        Set<EventResult>();

    public DbSet<Matchup> Matchups =>
        Set<Matchup>();

    public DbSet<User> Users =>
        Set<User>();

    public DbSet<RegionalLineupEntry>
        RegionalLineupEntries =>
            Set<RegionalLineupEntry>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(
            modelBuilder
        );

        /*
         * ----------------------------------
         * REGIONAL LINEUPS
         * ----------------------------------
         *
         * Prevent the same player from
         * appearing more than once in the
         * same team's lineup for an event.
         */
        modelBuilder
            .Entity<RegionalLineupEntry>()
            .HasIndex(entry => new
            {
                entry.LeagueMemberId,
                entry.RegionalEventId,
                entry.PlayerId
            })
            .IsUnique();

        /*
         * ----------------------------------
         * USERS
         * ----------------------------------
         */
        modelBuilder
            .Entity<User>()
            .HasIndex(user =>
                user.Email
            )
            .IsUnique();

        modelBuilder
            .Entity<User>()
            .HasIndex(user =>
                user.Username
            )
            .IsUnique();

        /*
         * ----------------------------------
         * MATCHUPS
         * ----------------------------------
         *
         * A matchup references LeagueMember
         * three different ways:
         *
         * TeamOne
         * TeamTwo
         * Winner
         *
         * These relationships are configured
         * explicitly so EF Core does not try
         * to infer ambiguous relationships.
         */

        modelBuilder
            .Entity<Matchup>()
            .HasOne(matchup =>
                matchup.TeamOne
            )
            .WithMany()
            .HasForeignKey(matchup =>
                matchup.TeamOneId
            )
            .OnDelete(
                DeleteBehavior.Restrict
            );

        modelBuilder
            .Entity<Matchup>()
            .HasOne(matchup =>
                matchup.TeamTwo
            )
            .WithMany()
            .HasForeignKey(matchup =>
                matchup.TeamTwoId
            )
            .OnDelete(
                DeleteBehavior.Restrict
            );

        modelBuilder
            .Entity<Matchup>()
            .HasOne(matchup =>
                matchup.Winner
            )
            .WithMany()
            .HasForeignKey(matchup =>
                matchup.WinnerId
            )
            .OnDelete(
                DeleteBehavior.Restrict
            );
    }
}