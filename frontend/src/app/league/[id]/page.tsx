"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

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

export default function LeaguePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeague() {
      try {
        const response = await fetch(
          `http://localhost:5255/api/leagues/${id}`
        );

        if (!response.ok) {
          throw new Error("League not found.");
        }

        const data: League = await response.json();

        setLeague(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong.");
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

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
              Fantasy League
            </p>

            <h1 className="mt-2 text-4xl font-black">
              {league.name}
            </h1>

            <p className="mt-3 text-zinc-400">
              {league.members.length} of {league.maxTeams} teams joined
            </p>
          </div>

          <button
            onClick={() => router.push(`/draft?leagueId=${league.id}`)}
            className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
          >
            Start Draft
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Invite Code
            </p>

            <p className="mt-3 text-3xl font-black tracking-widest">
              {league.inviteCode}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              Share this code with friends so they can join your league.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              League Size
            </p>

            <p className="mt-3 text-3xl font-black">
              {league.members.length}/{league.maxTeams}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              Teams currently registered.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Status
            </p>

            <p className="mt-3 text-3xl font-black text-green-400">
              Pre-Draft
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              Waiting for managers before the draft begins.
            </p>
          </section>
        </div>

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
            {league.members.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 font-bold text-yellow-400">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-bold">
                      {member.teamName}
                    </p>

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
            ))}

            {Array.from({
              length: Math.max(
                0,
                league.maxTeams - league.members.length
              ),
            }).map((_, index) => (
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
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}