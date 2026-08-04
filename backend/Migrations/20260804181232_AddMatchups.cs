using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Matchups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LeagueId = table.Column<int>(type: "integer", nullable: false),
                    RegionalEventId = table.Column<int>(type: "integer", nullable: false),
                    TeamOneId = table.Column<int>(type: "integer", nullable: false),
                    TeamTwoId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Matchups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Matchups_LeagueMembers_TeamOneId",
                        column: x => x.TeamOneId,
                        principalTable: "LeagueMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Matchups_LeagueMembers_TeamTwoId",
                        column: x => x.TeamTwoId,
                        principalTable: "LeagueMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Matchups_Leagues_LeagueId",
                        column: x => x.LeagueId,
                        principalTable: "Leagues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Matchups_RegionalEvents_RegionalEventId",
                        column: x => x.RegionalEventId,
                        principalTable: "RegionalEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Matchups_LeagueId",
                table: "Matchups",
                column: "LeagueId");

            migrationBuilder.CreateIndex(
                name: "IX_Matchups_RegionalEventId",
                table: "Matchups",
                column: "RegionalEventId");

            migrationBuilder.CreateIndex(
                name: "IX_Matchups_TeamOneId",
                table: "Matchups",
                column: "TeamOneId");

            migrationBuilder.CreateIndex(
                name: "IX_Matchups_TeamTwoId",
                table: "Matchups",
                column: "TeamTwoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Matchups");
        }
    }
}
