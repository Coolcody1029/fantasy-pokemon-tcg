"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

type PlayerScore = {
  playerId: number;
  name: string;
  placement: number | null;
  fantasyPoints: number;
};

type FantasyTeam = {
  id: number;
  name: string;
  score: number;
  players: PlayerScore[];
};

type MatchupDetail = {
  id: number;

  event: {
    id: number;
    name: string;
    seasonWeek: number;
    status: string;
  };

  teamOne: FantasyTeam;
  teamTwo: FantasyTeam;
};

export default function MatchupPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [matchup, setMatchup] =
    useState<MatchupDetail | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadMatchup() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5255/api/matchups/${id}`
        );

        if (!response.ok) {
          throw new Error(
            "Matchup not found."
          );
        }

        const data: MatchupDetail =
          await response.json();

        setMatchup(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load matchup."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadMatchup();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
            Loading matchup...
          </div>
        </div>
      </main>
    );
  }

  if (error || !matchup) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-400">
            {error || "Matchup not found."}
          </div>
        </div>
      </main>
    );
  }

  const isUpcoming =
    matchup.event.status === "Upcoming";

  const isLive =
    matchup.event.status === "Live";

  const isFinal =
    matchup.event.status === "Final";

  const isTie =
    matchup.teamOne.score ===
    matchup.teamTwo.score;

  const winningTeamId =
    isTie
      ? null
      : matchup.teamOne.score >
          matchup.teamTwo.score
        ? matchup.teamOne.id
        : matchup.teamTwo.id;

  function getStatusStyles() {
    if (isLive) {
      return "border-red-500/40 bg-red-950/30 text-red-400";
    }

    if (isFinal) {
      return "border-green-500/40 bg-green-950/30 text-green-400";
    }

    return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }

  function getStatusText() {
    if (isLive) {
      return "LIVE";
    }

    if (isFinal) {
      return "FINAL";
    }

    return "UPCOMING";
  }

  function formatPlacement(
    placement: number | null
  ) {
    if (placement === null) {
      return "No result";
    }

    const lastTwo =
      placement % 100;

    if (
      lastTwo >= 11 &&
      lastTwo <= 13
    ) {
      return `${placement}th`;
    }

    switch (placement % 10) {
      case 1:
        return `${placement}st`;

      case 2:
        return `${placement}nd`;

      case 3:
        return `${placement}rd`;

      default:
        return `${placement}th`;
    }
  }

  function renderTeam(
    team: FantasyTeam
  ) {
    const isWinner =
      winningTeamId === team.id;

    return (
      <section
        key={team.id}
        className={`overflow-hidden rounded-2xl border bg-zinc-900 ${
          isFinal && isWinner
            ? "border-yellow-400"
            : "border-zinc-800"
        }`}
      >
        <div className="border-b border-zinc-800 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              {isFinal && isWinner && (
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-yellow-400">
                  Winner
                </p>
              )}

              {isFinal &&
                isTie && (
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    Tie
                  </p>
                )}

              <h2 className="text-2xl font-black">
                {team.name}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Starting 6
              </p>
            </div>

            <div className="text-right">
              <p
                className={`text-5xl font-black ${
                  isFinal &&
                  isWinner
                    ? "text-yellow-400"
                    : "text-white"
                }`}
              >
                {team.score}
              </p>

              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Fantasy Pts
              </p>
            </div>
          </div>
        </div>

        {team.players.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No lineup was submitted
            for this Regional.
          </div>
        ) : (
          <div>
            {team.players.map(
              (
                player,
                index
              ) => (
                <div
                  key={
                    player.playerId
                  }
                  className="flex items-center justify-between gap-4 border-b border-zinc-800 px-6 py-5 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-sm font-black text-zinc-500">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {
                          player.name
                        }
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {player.placement !==
                        null
                          ? `Finished ${formatPlacement(
                              player.placement
                            )}`
                          : isUpcoming
                            ? "Event has not started"
                            : "No recorded finish"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`text-xl font-black ${
                        player.fantasyPoints >
                        0
                          ? "text-yellow-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {
                        player.fantasyPoints
                      }
                    </p>

                    <p className="text-xs text-zinc-600">
                      pts
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <button
          onClick={() =>
            router.back()
          }
          className="mb-8 text-sm font-semibold text-zinc-400 transition hover:text-yellow-400"
        >
          ← Back to League
        </button>

        <div className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
              Fantasy Week{" "}
              {
                matchup.event
                  .seasonWeek
              }
            </p>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black tracking-wider ${getStatusStyles()}`}
            >
              {getStatusText()}
            </span>
          </div>

          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            {matchup.event.name}
          </h1>

          <p className="mt-3 text-zinc-500">
            Head-to-head fantasy
            matchup
          </p>
        </div>

        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            <div className="text-center md:text-right">
              <p className="text-xl font-black">
                {
                  matchup.teamOne
                    .name
                }
              </p>

              <p
                className={`mt-2 text-5xl font-black ${
                  isFinal &&
                  winningTeamId ===
                    matchup.teamOne.id
                    ? "text-yellow-400"
                    : "text-white"
                }`}
              >
                {
                  matchup.teamOne
                    .score
                }
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-black text-sm font-black text-zinc-500">
                VS
              </div>
            </div>

            <div className="text-center md:text-left">
              <p className="text-xl font-black">
                {
                  matchup.teamTwo
                    .name
                }
              </p>

              <p
                className={`mt-2 text-5xl font-black ${
                  isFinal &&
                  winningTeamId ===
                    matchup.teamTwo.id
                    ? "text-yellow-400"
                    : "text-white"
                }`}
              >
                {
                  matchup.teamTwo
                    .score
                }
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-5 text-center">
            {isUpcoming && (
              <p className="text-sm text-zinc-500">
                Scores will begin
                updating when Regional
                results are available.
              </p>
            )}

            {isLive && (
              <p className="text-sm font-semibold text-red-400">
                Regional in progress —
                scores may change as
                results are updated.
              </p>
            )}

            {isFinal &&
              !isTie && (
                <p className="text-sm font-semibold text-yellow-400">
                  {winningTeamId ===
                  matchup.teamOne.id
                    ? matchup.teamOne
                        .name
                    : matchup.teamTwo
                        .name}{" "}
                  wins the matchup.
                </p>
              )}

            {isFinal &&
              isTie && (
                <p className="text-sm font-semibold text-zinc-300">
                  This matchup ended in
                  a tie.
                </p>
              )}
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {renderTeam(
            matchup.teamOne
          )}

          {renderTeam(
            matchup.teamTwo
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
          <p className="text-sm text-zinc-500">
            Only players submitted in
            each team's Starting 6
            contribute fantasy points
            to this matchup.
          </p>
        </div>
      </div>
    </main>
  );
}