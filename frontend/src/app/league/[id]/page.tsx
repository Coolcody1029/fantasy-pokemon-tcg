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

type DraftStatus = {
  id: number;
  leagueId: number;
  isComplete: boolean;
  createdAt: string;
};

function getFeaturedEvent(
  matchups: Matchup[]
) {
  const uniqueEvents =
    Array.from(
      new Map(
        matchups.map(
          (matchup) => [
            matchup.event.id,
            matchup.event,
          ]
        )
      ).values()
    );

  const liveEvent =
    uniqueEvents
      .filter(
        (event) =>
          event.status === "Live"
      )
      .sort(
        (a, b) =>
          a.seasonWeek -
          b.seasonWeek
      )[0] ?? null;

  const upcomingEvent =
    uniqueEvents
      .filter(
        (event) =>
          event.status ===
          "Upcoming"
      )
      .sort(
        (a, b) =>
          a.seasonWeek -
          b.seasonWeek
      )[0] ?? null;

  const latestFinalEvent =
    uniqueEvents
      .filter(
        (event) =>
          event.status === "Final"
      )
      .sort(
        (a, b) =>
          b.seasonWeek -
          a.seasonWeek
      )[0] ?? null;

  return (
    liveEvent ??
    upcomingEvent ??
    latestFinalEvent
  );
}

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

  const [draftExists, setDraftExists] =
    useState(false);

  const [draftComplete, setDraftComplete] =
    useState(false);

  const [
    lineupPlayerCount,
    setLineupPlayerCount,
  ] = useState<number | null>(null);

  const [
    loadingLineup,
    setLoadingLineup,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [
    generatingSchedule,
    setGeneratingSchedule,
  ] = useState(false);

  const [
    scheduleMessage,
    setScheduleMessage,
  ] = useState("");

  const [error, setError] =
    useState("");

  /*
   * ---------------------------------------
   * INITIAL LEAGUE LOAD
   * ---------------------------------------
   */

  useEffect(() => {
    async function loadLeague() {
      try {
        setLoading(true);
        setError("");

        const leagueResponse =
  await apiFetch(
    `/api/leagues/${id}`
  );

if (!leagueResponse.ok) {
  throw new Error(
    "League not found."
  );
}

const leagueData: League =
  await leagueResponse.json();

setLeague(leagueData);

const rosterResponse =
  await apiFetch(
    `/api/leagues/${id}/rosters`
  );
        if (rosterResponse.ok) {
          const rosterData: Roster[] =
            await rosterResponse.json();

          setRosters(rosterData);
        }

       const matchupsResponse =
  await apiFetch(
    `/api/matchups/league/${id}`
  );
        if (matchupsResponse.ok) {
          const matchupData: Matchup[] =
            await matchupsResponse.json();

          setMatchups(matchupData);
        }

        const myTeamResponse =
          await apiFetch(
            `/api/leagues/${id}/me`
          );

        if (
          myTeamResponse.status === 401
        ) {
          router.push("/login");
          return;
        }

        if (myTeamResponse.ok) {
          const myTeamData:
            MyLeagueTeam =
              await myTeamResponse.json();

          setMyTeam(
            myTeamData
          );

          /*
           * Check whether this league already
           * has an active/completed draft.
           *
           * The draft GET is protected, so
           * this must use apiFetch.
           */
          const draftResponse =
            await apiFetch(
              `/api/drafts/league/${id}`
            );

          if (
            draftResponse.status === 401
          ) {
            router.push("/login");
            return;
          }

          if (
            draftResponse.status === 403
          ) {
            throw new Error(
              "You are not allowed to view this league's draft."
            );
          }

          if (
            draftResponse.status === 404
          ) {
            setDraftExists(false);
            setDraftComplete(false);
          } else if (draftResponse.ok) {
            const draftData: DraftStatus =
              await draftResponse.json();

            setDraftExists(true);
            setDraftComplete(
              draftData.isComplete
            );
          } else {
            throw new Error(
              "Could not check draft status."
            );
          }
        } else {
          setMyTeam(null);
          setDraftExists(false);
          setDraftComplete(false);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadLeague();
    }
  }, [id, router]);

  /*
   * ---------------------------------------
   * LINEUP STATUS
   *
   * Whenever the relevant event changes,
   * check how many players this manager
   * currently has submitted.
   * ---------------------------------------
   */

  useEffect(() => {
    async function loadLineupStatus() {
      if (
        !myTeam ||
        matchups.length === 0
      ) {
        setLineupPlayerCount(
          null
        );

        setLoadingLineup(false);

        return;
      }

      const event =
        getFeaturedEvent(
          matchups
        );

      if (!event) {
        setLineupPlayerCount(
          null
        );

        setLoadingLineup(false);

        return;
      }

      setLoadingLineup(true);

      try {
        const response =
          await apiFetch(
            `/api/lineups/team/${myTeam.teamId}/event/${event.id}`
          );

        if (
          response.status === 401
        ) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          setLineupPlayerCount(
            null
          );

          return;
        }

        const lineup:
          Player[] =
            await response.json();

        setLineupPlayerCount(
          lineup.length
        );
      } catch {
        setLineupPlayerCount(
          null
        );
      } finally {
        setLoadingLineup(false);
      }
    }

    loadLineupStatus();
  }, [
    myTeam,
    matchups,
    router,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
            Loading league...
          </div>
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
            {error ||
              "League not found."}
          </div>
        </div>
      </main>
    );
  }

  const hasRosters =
    rosters.some(
      (roster) =>
        roster.players.length > 0
    );

  /*
   * ---------------------------------------
   * STANDINGS
   * ---------------------------------------
   */

  const standingsMap =
    new Map<number, Standing>();

  league.members.forEach(
    (member) => {
      standingsMap.set(
        member.id,
        {
          teamId:
            member.id,

          teamName:
            member.teamName,

          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        }
      );
    }
  );

  matchups
    .filter(
      (matchup) =>
        matchup.event.status ===
        "Final"
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

      if (
        !teamOne ||
        !teamTwo
      ) {
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
      if (
        b.wins !==
        a.wins
      ) {
        return (
          b.wins -
          a.wins
        );
      }

      if (
        b.ties !==
        a.ties
      ) {
        return (
          b.ties -
          a.ties
        );
      }

      return (
        b.pointsFor -
        a.pointsFor
      );
    });

  /*
   * ---------------------------------------
   * MY TEAM
   * ---------------------------------------
   */

  const myStanding =
    myTeam
      ? standings.find(
          (standing) =>
            standing.teamId ===
            myTeam.teamId
        ) ?? null
      : null;

  const myRank =
    myTeam
      ? standings.findIndex(
          (standing) =>
            standing.teamId ===
            myTeam.teamId
        ) + 1
      : 0;

  /*
   * ---------------------------------------
   * FEATURED EVENT
   * ---------------------------------------
   */

  const featuredEvent =
    getFeaturedEvent(
      matchups
    );

  const featuredMatchups =
    featuredEvent
      ? matchups.filter(
          (matchup) =>
            matchup.event.id ===
            featuredEvent.id
        )
      : [];

  /*
   * ---------------------------------------
   * MY FEATURED MATCHUP
   * ---------------------------------------
   */

  const myFeaturedMatchup =
    myTeam
      ? featuredMatchups.find(
          (matchup) =>
            matchup.teamOne.id ===
              myTeam.teamId ||
            matchup.teamTwo.id ===
              myTeam.teamId
        ) ?? null
      : null;

  const myFeaturedSide =
    myFeaturedMatchup &&
    myTeam
      ? myFeaturedMatchup
            .teamOne.id ===
          myTeam.teamId
        ? myFeaturedMatchup
            .teamOne
        : myFeaturedMatchup
            .teamTwo
      : null;

  const opponentSide =
    myFeaturedMatchup &&
    myTeam
      ? myFeaturedMatchup
            .teamOne.id ===
          myTeam.teamId
        ? myFeaturedMatchup
            .teamTwo
        : myFeaturedMatchup
            .teamOne
      : null;

  /*
   * ---------------------------------------
   * RECENT RESULT
   * ---------------------------------------
   */

  const myFinalMatchups =
    myTeam
      ? matchups
          .filter(
            (matchup) =>
              matchup.event
                .status ===
                "Final" &&
              (
                matchup.teamOne
                  .id ===
                  myTeam.teamId ||
                matchup.teamTwo
                  .id ===
                  myTeam.teamId
              )
          )
          .sort(
            (a, b) =>
              b.event
                .seasonWeek -
              a.event
                .seasonWeek
          )
      : [];

  const recentResult =
    myFinalMatchups[0] ??
    null;

  function getMyResultText(
    matchup: Matchup
  ) {
    if (!myTeam) {
      return "";
    }

    const mine =
      matchup.teamOne.id ===
      myTeam.teamId
        ? matchup.teamOne
        : matchup.teamTwo;

    const opponent =
      matchup.teamOne.id ===
      myTeam.teamId
        ? matchup.teamTwo
        : matchup.teamOne;

    if (
      mine.score >
      opponent.score
    ) {
      return "WIN";
    }

    if (
      mine.score <
      opponent.score
    ) {
      return "LOSS";
    }

    return "TIE";
  }

  function getStatusClass(
    status: string
  ) {
    if (
      status === "Live"
    ) {
      return "border-red-500/40 bg-red-950/30 text-red-400";
    }

    if (
      status === "Final"
    ) {
      return "border-green-500/40 bg-green-950/30 text-green-400";
    }

    return "border-yellow-400/30 bg-yellow-400/5 text-yellow-400";
  }

  /*
   * ---------------------------------------
   * LINEUP DISPLAY
   * ---------------------------------------
   */

  function getLineupStatusText() {
    if (!featuredEvent) {
      return "No Event";
    }

    if (
      loadingLineup
    ) {
      return "Checking...";
    }

    if (
      featuredEvent.status !==
      "Upcoming"
    ) {
      if (
        lineupPlayerCount === 6
      ) {
        return "Locked";
      }

      return "No Lineup";
    }

    if (
      lineupPlayerCount === 6
    ) {
      return "Ready";
    }

    if (
      lineupPlayerCount &&
      lineupPlayerCount > 0
    ) {
      return "Incomplete";
    }

    return "Not Set";
  }

  function getLineupStatusClass() {
    if (!featuredEvent) {
      return "text-zinc-500";
    }

    if (
      loadingLineup
    ) {
      return "text-zinc-400";
    }

    if (
      featuredEvent.status !==
      "Upcoming"
    ) {
      return "text-zinc-300";
    }

    if (
      lineupPlayerCount === 6
    ) {
      return "text-green-400";
    }

    return "text-yellow-400";
  }

  function getLineupButtonText() {
    if (!featuredEvent) {
      return "No Event";
    }

    if (
      featuredEvent.status ===
      "Live"
    ) {
      return "View Locked Lineup 🔒";
    }

    if (
      featuredEvent.status ===
      "Final"
    ) {
      return "View Final Lineup";
    }

    if (
      lineupPlayerCount === 6
    ) {
      return "Edit Starting 6";
    }

    return "Set Starting 6";
  }

  /*
   * ---------------------------------------
   * GENERATE SCHEDULE
   * ---------------------------------------
   */

  async function handleGenerateSchedule() {
    if (
      !league ||
      !myTeam?.isCommissioner
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Generate the fantasy schedule? Existing eligible pairings may be regenerated."
      );

    if (!confirmed) {
      return;
    }

    setGeneratingSchedule(true);
    setScheduleMessage("");
    setError("");

    try {
      const response =
        await apiFetch(
          `/api/matchups/generate/${league.id}`,
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Could not generate schedule."
        );
      }

      const matchupsResponse =
  await apiFetch(
    `/api/matchups/league/${league.id}`
  );

      if (
        matchupsResponse.ok
      ) {
        const matchupData:
          Matchup[] =
            await matchupsResponse.json();

        setMatchups(
          matchupData
        );
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
      setGeneratingSchedule(
        false
      );
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* LEAGUE HEADER */}

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
              Fantasy League
            </p>

            <h1 className="mt-2 text-4xl font-black">
              {league.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <span>
                {
                  league.members
                    .length
                }{" "}
                of{" "}
                {
                  league.maxTeams
                }{" "}
                teams
              </span>

              {myTeam && (
                <>
                  <span className="text-zinc-700">
                    •
                  </span>

                  <span>
                    Your Team:{" "}
                    <strong className="text-white">
                      {
                        myTeam.teamName
                      }
                    </strong>
                  </span>

                  {myTeam.isCommissioner && (
                    <span className="rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-bold text-yellow-400">
                      Commissioner
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!hasRosters &&
              myTeam &&
              draftExists &&
              !draftComplete && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/draft?leagueId=${league.id}`
                    )
                  }
                  className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
                >
                  Enter Draft
                </button>
              )}

            {!hasRosters &&
              myTeam?.isCommissioner &&
              !draftExists && (
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
                  onClick={
                    handleGenerateSchedule
                  }
                  disabled={
                    generatingSchedule
                  }
                  className="rounded-xl border border-yellow-400 px-6 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {generatingSchedule
                    ? "Generating..."
                    : matchups.length >
                        0
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

        {error && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* TEAM DASHBOARD */}

        {hasRosters &&
          myTeam && (
            <section className="mt-8">
              <div className="mb-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                  Team Dashboard
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  {
                    myTeam.teamName
                  }
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">

                {/* RECORD */}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                  <p className="text-sm font-semibold text-zinc-500">
                    Record
                  </p>

                  <p className="mt-3 text-3xl font-black">
                    {myStanding
                      ? `${myStanding.wins}-${myStanding.losses}-${myStanding.ties}`
                      : "0-0-0"}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    {myRank > 0
                      ? `#${myRank} in league`
                      : "Not ranked"}
                  </p>
                </div>

                {/* REGIONAL */}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                  <p className="text-sm font-semibold text-zinc-500">
                    {featuredEvent
                      ?.status ===
                    "Upcoming"
                      ? "Next Regional"
                      : featuredEvent
                            ?.status ===
                          "Live"
                        ? "Current Regional"
                        : "Latest Regional"}
                  </p>

                  <p className="mt-3 text-xl font-black">
                    {featuredEvent
                      ? featuredEvent.name
                      : "No event"}
                  </p>

                  {featuredEvent && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-zinc-500">
                        Week{" "}
                        {
                          featuredEvent.seasonWeek
                        }
                      </span>

                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-black uppercase ${getStatusClass(
                          featuredEvent.status
                        )}`}
                      >
                        {
                          featuredEvent.status
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* LINEUP */}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                  <p className="text-sm font-semibold text-zinc-500">
                    Starting 6
                  </p>

                  <p
                    className={`mt-3 text-2xl font-black ${getLineupStatusClass()}`}
                  >
                    {getLineupStatusText()}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    {loadingLineup
                      ? "Checking lineup..."
                      : lineupPlayerCount !==
                          null
                        ? `${lineupPlayerCount}/6 selected`
                        : "No lineup data"}
                  </p>

                  {featuredEvent &&
                    myFeaturedMatchup && (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/league/${id}/lineup?eventId=${featuredEvent.id}&teamId=${myTeam.teamId}`
                          )
                        }
                        className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-bold transition ${
                          featuredEvent.status ===
                          "Upcoming"
                            ? "bg-yellow-400 text-black hover:bg-yellow-300"
                            : "border border-zinc-700 bg-black text-white hover:border-yellow-400"
                        }`}
                      >
                        {getLineupButtonText()}
                      </button>
                    )}
                </div>

                {/* OPPONENT */}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                  <p className="text-sm font-semibold text-zinc-500">
                    Opponent
                  </p>

                  <p className="mt-3 text-xl font-black">
                    {opponentSide
                      ? opponentSide.name
                      : "—"}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    {myFeaturedMatchup
                      ? `Week ${myFeaturedMatchup.event.seasonWeek}`
                      : "No matchup scheduled"}
                  </p>
                </div>

                {/* RECENT RESULT */}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                  <p className="text-sm font-semibold text-zinc-500">
                    Recent Result
                  </p>

                  {recentResult ? (
                    <>
                      <p
                        className={`mt-3 text-3xl font-black ${
                          getMyResultText(
                            recentResult
                          ) ===
                          "WIN"
                            ? "text-green-400"
                            : getMyResultText(
                                  recentResult
                                ) ===
                                "LOSS"
                              ? "text-red-400"
                              : "text-zinc-300"
                        }`}
                      >
                        {getMyResultText(
                          recentResult
                        )}
                      </p>

                      <p className="mt-2 text-sm text-zinc-500">
                        {
                          recentResult
                            .event.name
                        }
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-3xl font-black text-zinc-600">
                        —
                      </p>

                      <p className="mt-2 text-sm text-zinc-500">
                        No completed matchups
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

        {/* CURRENT MATCHUP */}

        {hasRosters &&
          myTeam &&
          featuredEvent && (
            <section className="mt-8">
              <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                    Your Matchup
                  </p>

                  <h2 className="mt-1 text-3xl font-black">
                    {
                      featuredEvent.name
                    }
                  </h2>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase ${getStatusClass(
                    featuredEvent.status
                  )}`}
                >
                  {
                    featuredEvent.status
                  }
                </span>
              </div>

              {myFeaturedMatchup &&
              myFeaturedSide &&
              opponentSide ? (
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/matchup/${myFeaturedMatchup.id}`
                      )
                    }
                    className="w-full p-6 text-left transition hover:bg-zinc-800/40 md:p-8"
                  >
                    <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">

                      <div className="text-center md:text-right">
                        <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                          Your Team
                        </p>

                        <p className="mt-2 text-2xl font-black">
                          {
                            myFeaturedSide.name
                          }
                        </p>

                        <p className="mt-3 text-5xl font-black text-yellow-400">
                          {
                            myFeaturedSide.score
                          }
                        </p>
                      </div>

                      <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-black text-sm font-black text-zinc-500">
                          VS
                        </div>
                      </div>

                      <div className="text-center md:text-left">
                        <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                          Opponent
                        </p>

                        <p className="mt-2 text-2xl font-black">
                          {
                            opponentSide.name
                          }
                        </p>

                        <p className="mt-3 text-5xl font-black">
                          {
                            opponentSide.score
                          }
                        </p>
                      </div>
                    </div>

                    <p className="mt-6 text-center text-sm text-zinc-500">
                      Click to view scoring
                      breakdown
                    </p>
                  </button>

                  <div className="border-t border-zinc-800 p-4">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/league/${id}/lineup?eventId=${featuredEvent.id}&teamId=${myTeam.teamId}`
                        )
                      }
                      className={`w-full rounded-xl px-5 py-3 font-bold transition ${
                        featuredEvent.status ===
                        "Upcoming"
                          ? "bg-yellow-400 text-black hover:bg-yellow-300"
                          : "border border-zinc-700 bg-zinc-950 text-white hover:border-yellow-400"
                      }`}
                    >
                      {getLineupButtonText()}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
                  You do not have a matchup
                  scheduled for this event.
                </div>
              )}
            </section>
          )}

        {/* LEAGUE INFO */}

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Invite Code
            </p>

            <p className="mt-3 text-3xl font-black tracking-widest">
              {
                league.inviteCode
              }
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              Share this code with
              friends.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Teams
            </p>

            <p className="mt-3 text-3xl font-black">
              {
                league.members
                  .length
              }
              /
              {
                league.maxTeams
              }
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              Managers in this league.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Season
            </p>

            <p
              className={`mt-3 text-3xl font-black ${
                hasRosters
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {hasRosters
                ? "Active"
                : "Pre-Draft"}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              {hasRosters
                ? "Fantasy season underway."
                : "Waiting for the draft."}
            </p>
          </section>
        </div>

        {/* FEATURED EVENT MATCHUPS */}

        {featuredMatchups.length >
          0 && (
          <section className="mt-10">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                League Matchups
              </p>

              <h2 className="mt-1 text-3xl font-black">
                Fantasy Week{" "}
                {
                  featuredEvent
                    ?.seasonWeek
                }
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {featuredMatchups.map(
                (matchup) => {
                  const teamOneWon =
                    matchup.teamOne
                      .score >
                    matchup.teamTwo
                      .score;

                  const teamTwoWon =
                    matchup.teamTwo
                      .score >
                    matchup.teamOne
                      .score;

                  const tied =
                    matchup.teamOne
                      .score ===
                    matchup.teamTwo
                      .score;

                  const isMyMatchup =
                    myTeam !== null &&
                    (
                      matchup.teamOne
                        .id ===
                        myTeam.teamId ||
                      matchup.teamTwo
                        .id ===
                        myTeam.teamId
                    );

                  return (
                    <button
                      type="button"
                      key={
                        matchup.id
                      }
                      onClick={() =>
                        router.push(
                          `/matchup/${matchup.id}`
                        )
                      }
                      className={`overflow-hidden rounded-2xl border bg-zinc-900 text-left transition hover:bg-zinc-800/40 ${
                        isMyMatchup
                          ? "border-yellow-400"
                          : "border-zinc-800"
                      }`}
                    >
                      <div className="border-b border-zinc-800 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-yellow-400">
                            Week{" "}
                            {
                              matchup
                                .event
                                .seasonWeek
                            }
                          </p>

                          <span className="text-xs font-bold uppercase text-zinc-500">
                            {
                              matchup
                                .event
                                .status
                            }
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center justify-between gap-5">
                          <div>
                            <p
                              className={`font-bold ${
                                teamOneWon &&
                                matchup
                                  .event
                                  .status ===
                                  "Final"
                                  ? "text-green-400"
                                  : myTeam
                                        ?.teamId ===
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

                          <span className="text-xs font-black text-zinc-600">
                            VS
                          </span>

                          <div className="text-right">
                            <p
                              className={`font-bold ${
                                teamTwoWon &&
                                matchup
                                  .event
                                  .status ===
                                  "Final"
                                  ? "text-green-400"
                                  : myTeam
                                        ?.teamId ===
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

                        {matchup.event
                          .status ===
                          "Final" && (
                          <p className="mt-5 border-t border-zinc-800 pt-4 text-center text-sm">
                            {tied ? (
                              <span className="text-zinc-500">
                                Final • Tie
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
                                wins
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* STANDINGS */}

        {hasRosters &&
          standings.length > 0 && (
            <section className="mt-10">
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

        {/* ROSTERS */}

        {hasRosters ? (
          <section className="mt-10">
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
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-2xl font-black">
                                {
                                  roster
                                    .team
                                    .name
                                }
                              </h3>

                              {isMine && (
                                <span className="rounded-full bg-yellow-400 px-2 py-1 text-xs font-black text-black">
                                  YOUR TEAM
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
                              Fantasy Points
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        {roster.players.map(
                          (player) => (
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
                                  Fantasy Pts
                                </p>
                              </div>
                            </div>
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
          /* PRE-DRAFT */

          <section className="mt-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
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
                        Open Team Slot
                      </span>
                    </div>

                    <span className="text-sm text-zinc-600">
                      Waiting for manager
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