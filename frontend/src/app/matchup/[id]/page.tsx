"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

type PlayerScore = {
  playerId: number;
  name: string;
  placement: number | null;
  fantasyPoints: number;
  seasonPoolOrder: number;
};

type MatchupDetail = {
  id: number;

  event: {
    id: number;
    name: string;
    seasonWeek: number;
  };

  teamOne: {
    id: number;
    name: string;
    score: number;
    players: PlayerScore[];
  };

  teamTwo: {
    id: number;
    name: string;
    score: number;
    players: PlayerScore[];
  };
};

export default function MatchupPage() {
  const params = useParams();
  const id = params.id as string;

  const [matchup, setMatchup] =
    useState<MatchupDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMatchup() {
      try {
        const response = await fetch(
          `http://localhost:5255/api/matchups/${id}`
        );

        if (!response.ok) {
          throw new Error("Matchup not found.");
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

    loadMatchup();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-6xl px-6 py-12 text-zinc-400">
          Loading matchup...
        </div>
      </main>
    );
  }

  if (error || !matchup) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-400">
            {error || "Matchup not found."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
            Fantasy Week {matchup.event.seasonWeek}
          </p>

          <h1 className="mt-2 text-4xl font-black">
            {matchup.event.name}
          </h1>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {[matchup.teamOne, matchup.teamTwo].map(
            (team) => (
              <section
                key={team.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
              >
                <div className="border-b border-zinc-800 p-6">
                  <div className="flex items-end justify-between">
                    <h2 className="text-2xl font-black">
                      {team.name}
                    </h2>

                    <p className="text-4xl font-black text-yellow-400">
                      {team.score}
                    </p>
                  </div>
                </div>

                <div>
                  {team.players.map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 last:border-b-0"
                    >
                      <div>
                        <p className="font-bold">
                          {player.name}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {player.placement
                            ? `Finished #${player.placement}`
                            : "No result"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-black">
                          {player.fantasyPoints}
                        </p>

                        <p className="text-xs text-zinc-500">
                          Fantasy Pts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          )}
        </div>
      </div>
    </main>
  );
}