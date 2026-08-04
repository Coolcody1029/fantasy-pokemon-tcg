using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRegionalLineups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RegionalLineupEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LeagueMemberId = table.Column<int>(type: "integer", nullable: false),
                    RegionalEventId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegionalLineupEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RegionalLineupEntries_LeagueMembers_LeagueMemberId",
                        column: x => x.LeagueMemberId,
                        principalTable: "LeagueMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RegionalLineupEntries_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RegionalLineupEntries_RegionalEvents_RegionalEventId",
                        column: x => x.RegionalEventId,
                        principalTable: "RegionalEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RegionalLineupEntries_LeagueMemberId_RegionalEventId_Player~",
                table: "RegionalLineupEntries",
                columns: new[] { "LeagueMemberId", "RegionalEventId", "PlayerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RegionalLineupEntries_PlayerId",
                table: "RegionalLineupEntries",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_RegionalLineupEntries_RegionalEventId",
                table: "RegionalLineupEntries",
                column: "RegionalEventId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RegionalLineupEntries");
        }
    }
}
