"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { apiFetch } from "@/lib/api";

export default function JoinLeaguePage() {
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
  "/api/leagues/join",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inviteCode,
            teamName,
          }),
        }
      );

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || "Could not join league."
        );
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
          Fantasy League
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Join a League
        </h1>

        <p className="mt-3 text-zinc-400">
          Enter the invite code provided by your league commissioner.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Invite Code
            </label>

            <input
              value={inviteCode}
              onChange={(e) =>
                setInviteCode(e.target.value.toUpperCase())
              }
              required
              maxLength={8}
              placeholder="A1B2C3D4"
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 font-bold uppercase tracking-widest text-white outline-none transition focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Team Name
            </label>

            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              placeholder="Lost Zone Legends"
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-yellow-400"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Joining League..." : "Join League"}
          </button>
        </form>
      </div>
    </main>
  );
}