using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPostseasonSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Matchups_LeagueMembers_TeamOneId",
                table: "Matchups");

            migrationBuilder.DropForeignKey(
                name: "FK_Matchups_LeagueMembers_TeamTwoId",
                table: "Matchups");

            migrationBuilder.AddColumn<string>(
                name: "FantasyStage",
                table: "RegionalEvents",
                type: "text",
                nullable: false,
                defaultValue: "RegularSeason");

            migrationBuilder.AddColumn<bool>(
                name: "IsFinalized",
                table: "Matchups",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MatchupType",
                table: "Matchups",
                type: "text",
                nullable: false,
                defaultValue: "RegularSeason");

            migrationBuilder.AddColumn<int>(
                name: "WinnerId",
                table: "Matchups",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PlayoffTeamCount",
                table: "Leagues",
                type: "integer",
                nullable: false,
                defaultValue: 4);

            migrationBuilder.CreateIndex(
                name: "IX_Matchups_WinnerId",
                table: "Matchups",
                column: "WinnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Matchups_LeagueMembers_TeamOneId",
                table: "Matchups",
                column: "TeamOneId",
                principalTable: "LeagueMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Matchups_LeagueMembers_TeamTwoId",
                table: "Matchups",
                column: "TeamTwoId",
                principalTable: "LeagueMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Matchups_LeagueMembers_WinnerId",
                table: "Matchups",
                column: "WinnerId",
                principalTable: "LeagueMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Matchups_LeagueMembers_TeamOneId",
                table: "Matchups");

            migrationBuilder.DropForeignKey(
                name: "FK_Matchups_LeagueMembers_TeamTwoId",
                table: "Matchups");

            migrationBuilder.DropForeignKey(
                name: "FK_Matchups_LeagueMembers_WinnerId",
                table: "Matchups");

            migrationBuilder.DropIndex(
                name: "IX_Matchups_WinnerId",
                table: "Matchups");

            migrationBuilder.DropColumn(
                name: "FantasyStage",
                table: "RegionalEvents");

            migrationBuilder.DropColumn(
                name: "IsFinalized",
                table: "Matchups");

            migrationBuilder.DropColumn(
                name: "MatchupType",
                table: "Matchups");

            migrationBuilder.DropColumn(
                name: "WinnerId",
                table: "Matchups");

            migrationBuilder.DropColumn(
                name: "PlayoffTeamCount",
                table: "Leagues");

            migrationBuilder.AddForeignKey(
                name: "FK_Matchups_LeagueMembers_TeamOneId",
                table: "Matchups",
                column: "TeamOneId",
                principalTable: "LeagueMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Matchups_LeagueMembers_TeamTwoId",
                table: "Matchups",
                column: "TeamTwoId",
                principalTable: "LeagueMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}