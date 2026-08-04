"use client";

import { FormEvent, useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";

type LeagueMember = {
  id: number;
  teamName: string;
};

type League = {
  id: number;
  name: string;
  members: LeagueMember[];
};

type RegionalEvent = {
  id: number;
  name: string;
  seasonWeek: number;
};

export default function AdminMatchupsPage() {
  const [leagueId, setLeagueId] = useState("");
  const [league, setLeague] = useState<League | null>(null);
  const [events, setEvents] = useState<RegionalEvent[]>([]);

  const [regionalEventId, setRegionalEventId] = useState("");
  const [teamOneId, setTeamOneId] = useState("");
  const [teamTwoId, setTeamTwoId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch(
          "http://localhost:5255/api/regionalevents"
        );

        if (!response.ok) {
          throw new Error("Could not load Regionals.");
        }

        const data: RegionalEvent[] = await response.json();

        setEvents(data);

        if (data.length > 0) {
          setRegionalEventId(String(data[0].id));
        }
      } catch {
        setError("Could not load Regionals.");
      }
    }

    loadEvents();
  }, []);

  async function loadLeague() {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5255/api/leagues/${leagueId}`
      );

      if (!response.ok) {
        throw new Error("League not found.");
      }

      const data: League = await response.json();

      setLeague(data);

      if (data.members.length >= 2) {
        setTeamOneId(String(data.members[0].id));
        setTeamTwoId(String(data.members[1].id));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load league."
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5255/api/matchups",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leagueId: Number(leagueId),
            regionalEventId:
              Number(regionalEventId),
            teamOneId: Number(teamOneId),
            teamTwoId: Number(teamTwoId),
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text || "Could not create matchup."
        );
      }

      setMessage("Matchup created.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create matchup."
      );
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
          Admin
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Create Matchup
        </h1>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <label className="mb-2 block text-sm font-semibold">
            League ID
          </label>

          <div className="flex gap-3">
            <input
              value={leagueId}
              onChange={(e) =>
                setLeagueId(e.target.value)
              }
              type="number"
              className="flex-1 rounded-xl border border-zinc-700 bg-black px-4 py-3"
            />

            <button
              onClick={loadLeague}
              className="rounded-xl bg-yellow-400 px-5 font-bold text-black"
            >
              Load League
            </button>
          </div>
        </div>

        {league && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <h2 className="text-2xl font-bold">
              {league.name}
            </h2>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Regional
              </label>

              <select
                value={regionalEventId}
                onChange={(e) =>
                  setRegionalEventId(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
              >
                {events.map((event) => (
                  <option
                    key={event.id}
                    value={event.id}
                  >
                    Week {event.seasonWeek} —{" "}
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Team One
              </label>

              <select
                value={teamOneId}
                onChange={(e) =>
                  setTeamOneId(e.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
              >
                {league.members.map((member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.teamName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Team Two
              </label>

              <select
                value={teamTwoId}
                onChange={(e) =>
                  setTeamTwoId(e.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
              >
                {league.members.map((member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.teamName}
                  </option>
                ))}
              </select>
            </div>

            {message && (
              <div className="rounded-xl border border-green-900 bg-green-950/30 p-4 text-green-400">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black"
            >
              Create Matchup
            </button>
          </form>
        )}
      </div>
    </main>
  );
}