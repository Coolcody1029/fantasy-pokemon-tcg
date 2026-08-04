"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function CreateLeaguePage() {
  const router = useRouter();

  const [leagueName, setLeagueName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [maxTeams, setMaxTeams] = useState(8);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5255/api/leagues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leagueName,
          teamName,
          maxTeams,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to create league.");
      }

      const league = await response.json();

      router.push(`/league/${league.id}`);
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

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
          New League
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Create Fantasy League
        </h1>

        <p className="mt-3 text-zinc-400">
          Create a league, invite your friends, and draft competitive Pokémon
          TCG players for the season.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">
              League Name
            </label>

            <input
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              required
              placeholder="Pallet Town Champions"
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Your Team Name
            </label>

            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              placeholder="Rare Candy"
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Number of Teams
            </label>

            <select
              value={maxTeams}
              onChange={(e) => setMaxTeams(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-yellow-400"
            >
              <option value={4}>4 Teams</option>
              <option value={6}>6 Teams</option>
              <option value={8}>8 Teams</option>
              <option value={10}>10 Teams</option>
              <option value={12}>12 Teams</option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating League..." : "Create League"}
          </button>
        </form>
      </div>
    </main>
  );
}