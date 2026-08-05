"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import { apiFetch, getCurrentUser } from "@/lib/api";

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
};

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

type LimitlessImportResponse = {
  eventId: number;
  event: string;
  limitlessResultsFound: number;
  fantasyPlayersMatched: number;
  inserted: number;
  updated: number;
  ignored: number;
  message: string;
};

export default function AdminRegionalsPage() {
  const router = useRouter();

  const [checkingAdmin, setCheckingAdmin] =
    useState(true);


  const [players, setPlayers] =
    useState<Player[]>([]);

  const [events, setEvents] =
    useState<RegionalEvent[]>([]);

  const [eventName, setEventName] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [seasonWeek, setSeasonWeek] =
    useState(1);

  const [
    selectedEventId,
    setSelectedEventId,
  ] = useState("");

  const [
    selectedPlayerId,
    setSelectedPlayerId,
  ] = useState("");

  const [placement, setPlacement] =
    useState("");

  const [
    limitlessEventId,
    setLimitlessEventId,
  ] = useState("");

  const [
    limitlessUrl,
    setLimitlessUrl,
  ] = useState("");

  const [
    creatingEvent,
    setCreatingEvent,
  ] = useState(false);

  const [
    savingResult,
    setSavingResult,
  ] = useState(false);

  const [
    importingLimitless,
    setImportingLimitless,
  ] = useState(false);

  const [
    changingStatusId,
    setChangingStatusId,
  ] = useState<number | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadData() {
      try {
        /*
         * SECURITY:
         * Only the configured application admin
         * may view this page.
         */
        const currentUser =
          (await getCurrentUser()) as
            | CurrentUser
            | null;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        if (!currentUser.isAdmin) {
          router.replace("/");
          return;
        }

       const [
  playersResponse,
  eventsResponse,
] = await Promise.all([
  apiFetch(
    "/api/players"
  ),

  apiFetch(
    "/api/regionalevents"
  ),
]);

        if (
          !playersResponse.ok ||
          !eventsResponse.ok
        ) {
          throw new Error(
            "Could not load admin data."
          );
        }

        const playerData: Player[] =
          await playersResponse.json();

        const eventData: RegionalEvent[] =
          await eventsResponse.json();

        setPlayers(playerData);
        setEvents(eventData);

        if (eventData.length > 0) {
          setSelectedEventId(
            String(eventData[0].id)
          );

          setLimitlessEventId(
            String(eventData[0].id)
          );
        }

        if (playerData.length > 0) {
          setSelectedPlayerId(
            String(playerData[0].id)
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load admin data."
        );
      } finally {
        setCheckingAdmin(false);
      }
    }

    loadData();
  }, [router]);

  async function handleCreateEvent(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setCreatingEvent(true);

    try {
      const response =
        await apiFetch(
          "/api/regionalevents",
          {
            method: "POST",

            body: JSON.stringify({
              name: eventName,
              location,
              startDate:
                new Date(
                  startDate
                ).toISOString(),
              seasonWeek,
            }),
          }
        );

      if (
        response.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Could not create Regional."
        );
      }

      const createdEvent: RegionalEvent =
        await response.json();

      const updatedEvents = [
        ...events,
        createdEvent,
      ].sort(
        (a, b) =>
          a.seasonWeek -
          b.seasonWeek
      );

      setEvents(updatedEvents);

      setSelectedEventId(
        String(createdEvent.id)
      );

      setLimitlessEventId(
        String(createdEvent.id)
      );

      setEventName("");
      setLocation("");
      setStartDate("");

      setSeasonWeek(
        (previous) =>
          previous + 1
      );

      setMessage(
        "Regional created successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create Regional."
      );
    } finally {
      setCreatingEvent(false);
    }
  }

  async function handleStatusChange(
    eventId: number,
    status: string
  ) {
    setError("");
    setMessage("");
    setChangingStatusId(eventId);

    try {
      const response =
        await apiFetch(
          `/api/regionalevents/${eventId}/status`,
          {
            method: "PUT",

            body: JSON.stringify({
              status,
            }),
          }
        );

      if (
        response.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Could not update event status."
        );
      }

      setEvents(
        (previous) =>
          previous.map(
            (regionalEvent) =>
              regionalEvent.id ===
              eventId
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
    } finally {
      setChangingStatusId(null);
    }
  }

  async function handleAddResult(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !selectedEventId ||
      !selectedPlayerId
    ) {
      setError(
        "Select an event and player."
      );

      return;
    }

    setSavingResult(true);

    try {
      const response =
        await apiFetch(
          `/api/regionalevents/${selectedEventId}/results`,
          {
            method: "POST",

            body: JSON.stringify({
              playerId:
                Number(
                  selectedPlayerId
                ),

              placement:
                Number(placement),
            }),
          }
        );

      if (
        response.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Could not add result."
        );
      }

      const result =
        await response.json();

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
    } finally {
      setSavingResult(false);
    }
  }

  async function handleLimitlessImport(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!limitlessEventId) {
      setError(
        "Select a Regional."
      );

      return;
    }

    if (
      !limitlessUrl.trim()
    ) {
      setError(
        "Enter a Limitless tournament URL."
      );

      return;
    }

    const selectedEvent =
      events.find(
        (regionalEvent) =>
          regionalEvent.id ===
          Number(limitlessEventId)
      );

    if (
      selectedEvent?.status ===
      "Upcoming"
    ) {
      setError(
        "Change the Regional to Live or Final before importing results."
      );

      return;
    }

    setImportingLimitless(true);

    try {
      const response =
        await apiFetch(
          `/api/regionalevents/${limitlessEventId}/results/import-limitless`,
          {
            method: "POST",

            body: JSON.stringify({
              url:
                limitlessUrl.trim(),
            }),
          }
        );

      if (
        response.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Could not import Limitless results."
        );
      }

      const result:
        LimitlessImportResponse =
          await response.json();

      setMessage(
        `Limitless import complete. Found ${result.limitlessResultsFound} results, matched ${result.fantasyPlayersMatched} fantasy players, inserted ${result.inserted}, updated ${result.updated}, ignored ${result.ignored}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not import Limitless results."
      );
    } finally {
      setImportingLimitless(false);
    }
  }

  if (checkingAdmin) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
            Checking admin access...
          </div>
        </div>
      </main>
    );
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
            Create Regional events,
            manage event status,
            enter manual results,
            and import tournament
            standings from Limitless.
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
          {/* CREATE REGIONAL */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              New Event
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Create Regional
            </h2>

            <form
              onSubmit={
                handleCreateEvent
              }
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Event Name
                </label>

                <input
                  value={
                    eventName
                  }
                  onChange={(e) =>
                    setEventName(
                      e.target.value
                    )
                  }
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
                  value={
                    location
                  }
                  onChange={(e) =>
                    setLocation(
                      e.target.value
                    )
                  }
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
                  value={
                    startDate
                  }
                  onChange={(e) =>
                    setStartDate(
                      e.target.value
                    )
                  }
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
                  value={
                    seasonWeek
                  }
                  onChange={(e) =>
                    setSeasonWeek(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  required
                  min={1}
                  type="number"
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                disabled={
                  creatingEvent
                }
                className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {creatingEvent
                  ? "Creating..."
                  : "Create Regional"}
              </button>
            </form>
          </section>

          {/* LIMITLESS IMPORT */}
          <section className="rounded-2xl border border-yellow-400/40 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Automated Results
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Import from Limitless
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Pull placements directly
              from a Limitless tournament
              page and score players in
              the fantasy Top 150.
            </p>

            <form
              onSubmit={
                handleLimitlessImport
              }
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Regional
                </label>

                <select
                  value={
                    limitlessEventId
                  }
                  onChange={(e) =>
                    setLimitlessEventId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                >
                  {events.map(
                    (
                      regionalEvent
                    ) => (
                      <option
                        key={
                          regionalEvent.id
                        }
                        value={
                          regionalEvent.id
                        }
                      >
                        Week{" "}
                        {
                          regionalEvent.seasonWeek
                        }{" "}
                        —{" "}
                        {
                          regionalEvent.name
                        }{" "}
                        (
                        {
                          regionalEvent.status
                        }
                        )
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Limitless URL
                </label>

                <input
                  value={
                    limitlessUrl
                  }
                  onChange={(e) =>
                    setLimitlessUrl(
                      e.target.value
                    )
                  }
                  required
                  placeholder="https://limitlesstcg.com/tournaments/518"
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                disabled={
                  importingLimitless ||
                  events.length === 0
                }
                className="w-full rounded-xl bg-yellow-400 py-3 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importingLimitless
                  ? "Importing..."
                  : "Import Limitless Results"}
              </button>
            </form>

            <div className="mt-5 rounded-xl border border-zinc-800 bg-black p-4 text-sm text-zinc-500">
              The Regional must be{" "}
              <span className="font-bold text-white">
                Live
              </span>{" "}
              or{" "}
              <span className="font-bold text-white">
                Final
              </span>{" "}
              before results can be
              imported.
            </div>
          </section>

          {/* MANUAL RESULT */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Tournament Result
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Add Player Finish
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Manual fallback for
              entering an individual
              player's placement.
            </p>

            <form
              onSubmit={
                handleAddResult
              }
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Regional
                </label>

                <select
                  value={
                    selectedEventId
                  }
                  onChange={(e) =>
                    setSelectedEventId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                >
                  {events.map(
                    (
                      regionalEvent
                    ) => (
                      <option
                        key={
                          regionalEvent.id
                        }
                        value={
                          regionalEvent.id
                        }
                      >
                        Week{" "}
                        {
                          regionalEvent.seasonWeek
                        }{" "}
                        —{" "}
                        {
                          regionalEvent.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Player
                </label>

                <select
                  value={
                    selectedPlayerId
                  }
                  onChange={(e) =>
                    setSelectedPlayerId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                >
                  {players.map(
                    (player) => (
                      <option
                        key={
                          player.id
                        }
                        value={
                          player.id
                        }
                      >
                        #
                        {
                          player.seasonStartingRank
                        }{" "}
                        —{" "}
                        {
                          player.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Placement
                </label>

                <input
                  value={
                    placement
                  }
                  onChange={(e) =>
                    setPlacement(
                      e.target.value
                    )
                  }
                  required
                  min={1}
                  type="number"
                  placeholder="3"
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                disabled={
                  savingResult
                }
                className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingResult
                  ? "Saving..."
                  : "Save Result"}
              </button>
            </form>
          </section>

          {/* EVENT STATUS */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-yellow-400">
              Event Status
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Manage Regionals
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Upcoming lineups are
              editable. Live and Final
              Regionals are locked.
            </p>

            <div className="mt-6 space-y-4">
              {events.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-zinc-700 bg-black p-6 text-center text-zinc-500">
                  No Regionals created
                  yet.
                </div>
              ) : (
                events.map(
                  (
                    regionalEvent
                  ) => (
                    <div
                      key={
                        regionalEvent.id
                      }
                      className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-black p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-bold">
                          Week{" "}
                          {
                            regionalEvent.seasonWeek
                          }{" "}
                          —{" "}
                          {
                            regionalEvent.name
                          }
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {
                            regionalEvent.location
                          }
                        </p>

                        <p className="mt-2 text-xs text-zinc-600">
                          Current
                          status:{" "}
                          <span className="font-bold text-white">
                            {
                              regionalEvent.status
                            }
                          </span>
                        </p>
                      </div>

                      <select
                        value={
                          regionalEvent.status
                        }
                        disabled={
                          changingStatusId ===
                          regionalEvent.id
                        }
                        onChange={(e) =>
                          handleStatusChange(
                            regionalEvent.id,
                            e.target
                              .value
                          )
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
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
                  )
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}