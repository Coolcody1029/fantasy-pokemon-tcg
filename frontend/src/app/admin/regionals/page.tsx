"use client";

import { FormEvent, useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";

type Player = {
  id: number;
  name: string;
  country: string;
  seasonStartingRank: number;
  seasonPoolOrder: number;
};

type RegionalEvent = {
  id: number;
  name: string;
  location: string;
  startDate: string;
  seasonWeek: number;
  status: string;
};

export default function AdminRegionalsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<RegionalEvent[]>([]);

  const [eventName, setEventName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [seasonWeek, setSeasonWeek] = useState(1);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [placement, setPlacement] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [playersResponse, eventsResponse] = await Promise.all([
          fetch("http://localhost:5255/api/players"),
          fetch("http://localhost:5255/api/regionalevents"),
        ]);

        if (!playersResponse.ok || !eventsResponse.ok) {
          throw new Error("Could not load admin data.");
        }

        const playerData: Player[] = await playersResponse.json();
        const eventData: RegionalEvent[] = await eventsResponse.json();

        setPlayers(playerData);
        setEvents(eventData);

        if (eventData.length > 0) {
          setSelectedEventId(String(eventData[0].id));
        }

        if (playerData.length > 0) {
          setSelectedPlayerId(String(playerData[0].id));
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load admin data."
        );
      }
    }

    loadData();
  }, []);

  async function handleCreateEvent(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5255/api/regionalevents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: eventName,
            location,
            startDate: new Date(startDate).toISOString(),
            seasonWeek,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Could not create Regional.");
      }

      const createdEvent: RegionalEvent = await response.json();

      setEvents((previous) => [...previous, createdEvent]);
      setSelectedEventId(String(createdEvent.id));

      setEventName("");
      setLocation("");
      setStartDate("");
      setSeasonWeek((previous) => previous + 1);

      setMessage("Regional created successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create Regional."
      );
    }
  }
    async function handleStatusChange(
    eventId: number,
    status: string
    ) {
    setError("");
  setMessage("");

    try {
     const response = await fetch(
      `http://localhost:5255/api/regionalevents/${eventId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        text || "Could not update event status."
      );
    }

    setEvents((previous) =>
      previous.map((regionalEvent) =>
        regionalEvent.id === eventId
          ? {
              ...regionalEvent,
              status,
            }
          : regionalEvent
      )
    );

    setMessage(
      `Regional status changed to ${status}.`
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Could not update event status."
    );
  }
    }
  async function handleAddResult(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!selectedEventId || !selectedPlayerId) {
      setError("Select an event and player.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5255/api/regionalevents/${selectedEventId}/results`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: Number(selectedPlayerId),
            placement: Number(placement),
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Could not add result.");
      }

      const result = await response.json();

      setPlacement("");

      setMessage(
        `Result saved. Player earned ${result.fantasyPoints} fantasy points.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not add result."
      );
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Regional Management
          </h1>

          <p className="mt-3 text-zinc-400">
            Create Regional events and enter tournament results.
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-green-900 bg-green-950/30 p-4 text-green-400">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-400">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              New Event
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Create Regional
            </h2>

            <form
              onSubmit={handleCreateEvent}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Event Name
                </label>

                <input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  placeholder="Baltimore Regional"
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Location
                </label>

                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  placeholder="Baltimore, MD"
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Start Date
                </label>

                <input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  type="date"
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Fantasy Week
                </label>

                <input
                  value={seasonWeek}
                  onChange={(e) =>
                    setSeasonWeek(Number(e.target.value))
                  }
                  required
                  min={1}
                  type="number"
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300"
              >
                Create Regional
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Tournament Result
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Add Player Finish
            </h2>

            <form
              onSubmit={handleAddResult}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Regional
                </label>

                <select
                  value={selectedEventId}
                  onChange={(e) =>
                    setSelectedEventId(e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                >
                  {events.map((regionalEvent) => (
                    <option
                      key={regionalEvent.id}
                      value={regionalEvent.id}
                    >
                      Week {regionalEvent.seasonWeek} —{" "}
                      {regionalEvent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Player
                </label>

                <select
                  value={selectedPlayerId}
                  onChange={(e) =>
                    setSelectedPlayerId(e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                >
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      #{player.seasonStartingRank} — {player.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Placement
                </label>

                <input
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  required
                  min={1}
                  type="number"
                  placeholder="3"
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300"
              >
                Save Result
              </button>
            </form>
          </section>
          <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
  <p className="text-sm font-semibold text-yellow-400">
    Event Status
  </p>

  <h2 className="mt-1 text-2xl font-bold">
    Manage Regionals
  </h2>

  <div className="mt-6 space-y-4">
    {events.map((regionalEvent) => (
      <div
        key={regionalEvent.id}
        className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-black p-5 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p className="font-bold">
            Week {regionalEvent.seasonWeek} —{" "}
            {regionalEvent.name}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {regionalEvent.location}
          </p>
        </div>

        <select
          value={regionalEvent.status}
          onChange={(e) =>
            handleStatusChange(
              regionalEvent.id,
              e.target.value
            )
          }
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold text-white"
        >
          <option value="Upcoming">
            Upcoming
          </option>

          <option value="Live">
            Live
          </option>

          <option value="Final">
            Final
          </option>
        </select>
      </div>
    ))}
  </div>
</section>
        </div>
      </div>
    </main>
  );
}