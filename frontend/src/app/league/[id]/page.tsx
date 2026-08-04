"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { apiFetch } from "@/lib/api";

type LeagueMember = {
  id: number;
  teamName: string;
  leagueId: number;
  isCommissioner: boolean;
};

type League = {
  id: number;
  name: string;
  inviteCode: string;
  maxTeams: number;
  createdAt: string;
  members: LeagueMember[];
};

type Player = {
  id: number;
  name: string;
  country: string;
  seasonStartingRank: number;
  seasonPoolOrder: number;
  fantasyPoints: number;
  recentFinish: string;
};

type MatchupTeam = {
  id: number;
  name: string;
  score: number;
};

type Matchup = {
  id: number;

  event: {
    id: number;
    name: string;
    seasonWeek: number;
    status: string;
  };

  teamOne: MatchupTeam;
  teamTwo: MatchupTeam;
};

type Standing = {
  teamId: number;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
};

type Roster = {
  team: {
    id: number;
    name: string;
    isCommissioner: boolean;
  };

  players: Player[];
};

type MyLeagueTeam = {
  teamId: number;
  teamName: string;
  isCommissioner: boolean;
};

export default function LeaguePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [league, setLeague] =
    useState<League | null>(null);

  const [rosters, setRosters] =
    useState<Roster[]>([]);

  const [matchups, setMatchups] =
    useState<Matchup[]>([]);

  const [myTeam, setMyTeam] =
    useState<MyLeagueTeam | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [generatingSchedule, setGeneratingSchedule] =
  useState(false);

  const [scheduleMessage, setScheduleMessage] =
  useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadLeague() {
      try {
        /*
         * League
         */
        const leagueResponse = await fetch(
          `http://localhost:5255/api/leagues/${id}`
        );

        if (!leagueResponse.ok) {
          throw new Error(
            "League not found."
          );
        }

        const leagueData: League =
          await leagueResponse.json();

        setLeague(leagueData);

        /*
         * Rosters
         */
        const rosterResponse = await fetch(
          `http://localhost:5255/api/leagues/${id}/rosters`
        );

        if (rosterResponse.ok) {
          const rosterData: Roster[] =
            await rosterResponse.json();

          setRosters(rosterData);
        }

        /*
         * Matchups
         */
        const matchupsResponse = await fetch(
          `http://localhost:5255/api/matchups/league/${id}`
        );

        if (matchupsResponse.ok) {
          const matchupData: Matchup[] =
            await matchupsResponse.json();

          setMatchups(matchupData);
        }

        /*
         * Logged-in user's team
         */
        const myTeamResponse = await apiFetch(
          `/api/leagues/${id}/me`
        );

        if (myTeamResponse.ok) {
          const myTeamData: MyLeagueTeam =
            await myTeamResponse.json();

          setMyTeam(myTeamData);
        } else {
          setMyTeam(null);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Something went wrong."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadLeague();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-zinc-400">
            Loading league...
          </p>
        </div>
      </main>
    );
  }

  if (error || !league) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-400">
            {error || "League not found."}
          </div>
        </div>
      </main>
    );
  }

  const hasRosters = rosters.some(
    (roster) =>
      roster.players.length > 0
  );

  /*
   * Current fantasy week
   */
  const currentWeek =
    matchups.length > 0
      ? Math.max(
          ...matchups.map(
            (matchup) =>
              matchup.event.seasonWeek
          )
        )
      : null;

  const currentMatchups =
    currentWeek === null
      ? []
      : matchups.filter(
          (matchup) =>
            matchup.event.seasonWeek ===
            currentWeek
        );

  /*
   * Standings
   */
  const standingsMap =
    new Map<number, Standing>();

  league.members.forEach((member) => {
    standingsMap.set(member.id, {
      teamId: member.id,
      teamName: member.teamName,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });
  });

  /*
   * Only FINAL Regionals count toward
   * official standings.
   */
  matchups
    .filter(
      (matchup) =>
        matchup.event.status === "Final"
    )
    .forEach((matchup) => {
      const teamOne =
        standingsMap.get(
          matchup.teamOne.id
        );

      const teamTwo =
        standingsMap.get(
          matchup.teamTwo.id
        );

      if (!teamOne || !teamTwo) {
        return;
      }

      teamOne.pointsFor +=
        matchup.teamOne.score;

      teamOne.pointsAgainst +=
        matchup.teamTwo.score;

      teamTwo.pointsFor +=
        matchup.teamTwo.score;

      teamTwo.pointsAgainst +=
        matchup.teamOne.score;

      if (
        matchup.teamOne.score >
        matchup.teamTwo.score
      ) {
        teamOne.wins += 1;
        teamTwo.losses += 1;
      } else if (
        matchup.teamTwo.score >
        matchup.teamOne.score
      ) {
        teamTwo.wins += 1;
        teamOne.losses += 1;
      } else {
        teamOne.ties += 1;
        teamTwo.ties += 1;
      }
    });

  const standings =
    Array.from(
      standingsMap.values()
    ).sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      if (b.ties !== a.ties) {
        return b.ties - a.ties;
      }

      return (
        b.pointsFor -
        a.pointsFor
      );
    });

  async function handleGenerateSchedule() {
    if (!league || !myTeam?.isCommissioner) {
      return;
    }

    const confirmed = window.confirm(
      "Generate the fantasy schedule? Existing pairings will be regenerated."
    );

    if (!confirmed) {
      return;
    }

    setGeneratingSchedule(true);
    setScheduleMessage("");
    setError("");

    try {
      const response = await apiFetch(
        `/api/matchups/generate/${league.id}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          text || "Could not generate schedule."
        );
      }

      const matchupsResponse = await fetch(
        `http://localhost:5255/api/matchups/league/${league.id}`
      );

      if (matchupsResponse.ok) {
        const matchupData: Matchup[] =
          await matchupsResponse.json();

        setMatchups(matchupData);
      }

      setScheduleMessage(
        "Schedule generated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate schedule."
      );
    } finally {
      setGeneratingSchedule(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* League Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
              Fantasy League
            </p>

            <h1 className="mt-2 text-4xl font-black">
              {league.name}
            </h1>

            <p className="mt-3 text-zinc-400">
              {league.members.length} of{" "}
              {league.maxTeams} teams
            </p>

            {myTeam && (
              <p className="mt-2 text-sm text-zinc-500">
                Your Team:{" "}
                <span className="font-bold text-white">
                  {myTeam.teamName}
                </span>

                {myTeam.isCommissioner && (
                  <span className="ml-2 text-yellow-400">
                    • Commissioner
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {!hasRosters &&
              myTeam?.isCommissioner && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/draft?leagueId=${league.id}`
                    )
                  }
                  className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
                >
                  Start Draft
                </button>
              )}

            {hasRosters &&
              myTeam?.isCommissioner && (
                <button
                  type="button"
                  onClick={handleGenerateSchedule}
                  disabled={generatingSchedule}
                  className="rounded-xl border border-yellow-400 px-6 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {generatingSchedule
                    ? "Generating..."
                    : matchups.length > 0
                      ? "Regenerate Schedule"
                      : "Generate Schedule"}
                </button>
              )}
          </div>
        </div>

        {scheduleMessage && (
          <div className="mt-6 rounded-xl border border-green-900 bg-green-950/30 p-4 text-green-400">
            {scheduleMessage}
          </div>
        )}

        {/* League Summary */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Invite Code
            </p>

            <p className="mt-3 text-3xl font-black tracking-widest">
              {league.inviteCode}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              Share this code with friends.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Teams
            </p>

            <p className="mt-3 text-3xl font-black">
              {league.members.length}/
              {league.maxTeams}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              Managers in this league.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Status
            </p>

            <p
              className={`mt-3 text-3xl font-black ${
                hasRosters
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {hasRosters
                ? "Season Active"
                : "Pre-Draft"}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              {hasRosters
                ? "Rosters are locked in."
                : "Waiting for the draft."}
            </p>
          </section>
        </div>

        {/* Current Matchups */}
        {currentMatchups.length > 0 && (
          <section className="mt-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                  Fantasy Week{" "}
                  {currentWeek}
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  {
                    currentMatchups[0]
                      .event.name
                  }
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Status:{" "}
                  <span
                    className={
                      currentMatchups[0]
                        .event.status ===
                      "Live"
                        ? "font-bold text-red-400"
                        : currentMatchups[0]
                              .event.status ===
                            "Final"
                          ? "font-bold text-green-400"
                          : "font-bold text-yellow-400"
                    }
                  >
                    {
                      currentMatchups[0]
                        .event.status
                    }
                  </span>
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {currentMatchups.map(
                (matchup) => {
                  const teamOneWon =
                    matchup.teamOne.score >
                    matchup.teamTwo.score;

                  const teamTwoWon =
                    matchup.teamTwo.score >
                    matchup.teamOne.score;

                  const tied =
                    matchup.teamOne.score ===
                    matchup.teamTwo.score;

                  const isMyMatchup =
                    myTeam !== null &&
                    (matchup.teamOne.id ===
                      myTeam.teamId ||
                      matchup.teamTwo.id ===
                        myTeam.teamId);

                  return (
                    <div
                      key={matchup.id}
                      className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                    >
                      {/* Matchup header */}
                      <div className="border-b border-zinc-800 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-yellow-400">
                            Week{" "}
                            {
                              matchup.event
                                .seasonWeek
                            }
                          </p>

                          <span className="text-xs font-bold uppercase text-zinc-500">
                            {
                              matchup.event
                                .status
                            }
                          </span>
                        </div>
                      </div>

                      {/* Clickable matchup */}
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/matchup/${matchup.id}`
                          )
                        }
                        className="w-full p-6 text-left transition hover:bg-zinc-800/40"
                      >
                        <div className="flex items-center justify-between gap-6">
                          <div>
                            <p
                              className={`font-bold ${
                                teamOneWon
                                  ? "text-green-400"
                                  : myTeam?.teamId ===
                                      matchup
                                        .teamOne
                                        .id
                                    ? "text-yellow-400"
                                    : "text-white"
                              }`}
                            >
                              {
                                matchup
                                  .teamOne
                                  .name
                              }
                            </p>

                            <p className="mt-2 text-3xl font-black">
                              {
                                matchup
                                  .teamOne
                                  .score
                              }
                            </p>
                          </div>

                          <p className="text-sm font-bold text-zinc-600">
                            VS
                          </p>

                          <div className="text-right">
                            <p
                              className={`font-bold ${
                                teamTwoWon
                                  ? "text-green-400"
                                  : myTeam?.teamId ===
                                      matchup
                                        .teamTwo
                                        .id
                                    ? "text-yellow-400"
                                    : "text-white"
                              }`}
                            >
                              {
                                matchup
                                  .teamTwo
                                  .name
                              }
                            </p>

                            <p className="mt-2 text-3xl font-black">
                              {
                                matchup
                                  .teamTwo
                                  .score
                              }
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 border-t border-zinc-800 pt-4 text-center text-sm">
                          {tied ? (
                            <span className="text-zinc-500">
                              Matchup tied
                            </span>
                          ) : (
                            <span className="font-semibold text-green-400">
                              {teamOneWon
                                ? matchup
                                    .teamOne
                                    .name
                                : matchup
                                    .teamTwo
                                    .name}{" "}
                              leads
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-center text-xs text-zinc-600">
                          Click to view matchup
                          details
                        </p>
                      </button>

                      {/* My Team Controls */}
                      {myTeam &&
                        isMyMatchup && (
                          <div className="border-t border-zinc-800 p-4">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/league/${id}/lineup?eventId=${matchup.event.id}&teamId=${myTeam.teamId}`
                                )
                              }
                              className={`w-full rounded-xl px-4 py-3 font-bold transition ${
                                matchup.event
                                  .status ===
                                "Upcoming"
                                  ? "bg-yellow-400 text-black hover:bg-yellow-300"
                                  : "border border-zinc-700 bg-zinc-950 text-white hover:border-yellow-400"
                              }`}
                            >
                              {matchup.event
                                .status ===
                              "Upcoming"
                                ? "Set Lineup"
                                : matchup.event
                                      .status ===
                                    "Live"
                                  ? "View Lineup 🔒"
                                  : "View Final Lineup"}
                            </button>
                          </div>
                        )}
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* Standings */}
        {hasRosters &&
          standings.length > 0 && (
            <section className="mt-8">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                  League
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  Standings
                </h2>
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
                      <tr>
                        <th className="px-6 py-4">
                          Rank
                        </th>

                        <th className="px-6 py-4">
                          Team
                        </th>

                        <th className="px-6 py-4 text-center">
                          W
                        </th>

                        <th className="px-6 py-4 text-center">
                          L
                        </th>

                        <th className="px-6 py-4 text-center">
                          T
                        </th>

                        <th className="px-6 py-4 text-center">
                          PF
                        </th>

                        <th className="px-6 py-4 text-center">
                          PA
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {standings.map(
                        (
                          team,
                          index
                        ) => (
                          <tr
                            key={
                              team.teamId
                            }
                            className={`border-b border-zinc-800 last:border-b-0 ${
                              myTeam
                                ?.teamId ===
                              team.teamId
                                ? "bg-yellow-400/5"
                                : ""
                            }`}
                          >
                            <td className="px-6 py-5 font-black text-yellow-400">
                              #
                              {index +
                                1}
                            </td>

                            <td className="px-6 py-5 font-bold">
                              {
                                team.teamName
                              }

                              {myTeam
                                ?.teamId ===
                                team.teamId && (
                                <span className="ml-2 text-xs text-yellow-400">
                                  YOU
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-5 text-center font-bold text-green-400">
                              {
                                team.wins
                              }
                            </td>

                            <td className="px-6 py-5 text-center font-bold text-red-400">
                              {
                                team.losses
                              }
                            </td>

                            <td className="px-6 py-5 text-center font-bold text-zinc-300">
                              {
                                team.ties
                              }
                            </td>

                            <td className="px-6 py-5 text-center font-bold">
                              {
                                team.pointsFor
                              }
                            </td>

                            <td className="px-6 py-5 text-center text-zinc-400">
                              {
                                team.pointsAgainst
                              }
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

        {/* Rosters */}
        {hasRosters ? (
          <section className="mt-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                Season Rosters
              </p>

              <h2 className="mt-1 text-3xl font-black">
                League Teams
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {rosters.map(
                (roster) => {
                  const totalFantasyPoints =
                    roster.players.reduce(
                      (
                        total,
                        player
                      ) =>
                        total +
                        player.fantasyPoints,
                      0
                    );

                  const isMine =
                    myTeam?.teamId ===
                    roster.team.id;

                  return (
                    <div
                      key={
                        roster.team.id
                      }
                      className={`overflow-hidden rounded-2xl border bg-zinc-900 ${
                        isMine
                          ? "border-yellow-400"
                          : "border-zinc-800"
                      }`}
                    >
                      <div className="border-b border-zinc-800 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-2xl font-black">
                                {
                                  roster
                                    .team
                                    .name
                                }
                              </h3>

                              {isMine && (
                                <span className="rounded-full bg-yellow-400 px-2 py-1 text-xs font-black text-black">
                                  YOUR
                                  TEAM
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                              {roster
                                .team
                                .isCommissioner
                                ? "Commissioner"
                                : "League Member"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-black text-yellow-400">
                              {
                                totalFantasyPoints
                              }
                            </p>

                            <p className="text-xs text-zinc-500">
                              Fantasy
                              Points
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        {roster.players
                          .length ===
                        0 ? (
                          <div className="p-6 text-sm text-zinc-500">
                            No players on
                            this roster.
                          </div>
                        ) : (
                          roster.players.map(
                            (
                              player
                            ) => (
                              <div
                                key={
                                  player.id
                                }
                                className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 last:border-b-0"
                              >
                                <div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-yellow-400">
                                      #
                                      {
                                        player.seasonStartingRank
                                      }
                                    </span>

                                    <p className="font-bold">
                                      {
                                        player.name
                                      }
                                    </p>
                                  </div>

                                  <p className="mt-1 text-sm text-zinc-500">
                                    {
                                      player.country
                                    }
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="font-black">
                                    {
                                      player.fantasyPoints
                                    }
                                  </p>

                                  <p className="text-xs text-zinc-500">
                                    Fantasy
                                    Pts
                                  </p>
                                </div>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        ) : (
          /* Pre-Draft Members */
          <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 p-6">
              <p className="text-sm font-semibold text-yellow-400">
                Managers
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                League Teams
              </h2>
            </div>

            <div>
              {league.members.map(
                (
                  member,
                  index
                ) => {
                  const isMine =
                    myTeam?.teamId ===
                    member.id;

                  return (
                    <div
                      key={
                        member.id
                      }
                      className={`flex items-center justify-between border-b border-zinc-800 px-6 py-5 last:border-b-0 ${
                        isMine
                          ? "bg-yellow-400/5"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 font-bold text-yellow-400">
                          {index + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">
                              {
                                member.teamName
                              }
                            </p>

                            {isMine && (
                              <span className="text-xs font-bold text-yellow-400">
                                YOU
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-zinc-500">
                            {member.isCommissioner
                              ? "Commissioner"
                              : "League Member"}
                          </p>
                        </div>
                      </div>

                      {member.isCommissioner && (
                        <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-400">
                          Commissioner
                        </span>
                      )}
                    </div>
                  );
                }
              )}

              {Array.from({
                length: Math.max(
                  0,
                  league.maxTeams -
                    league.members
                      .length
                ),
              }).map(
                (_, index) => (
                  <div
                    key={`open-${index}`}
                    className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-zinc-700 text-zinc-600">
                        +
                      </div>

                      <span className="text-zinc-500">
                        Open Team
                        Slot
                      </span>
                    </div>

                    <span className="text-sm text-zinc-600">
                      Waiting for
                      manager
                    </span>
                  </div>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}