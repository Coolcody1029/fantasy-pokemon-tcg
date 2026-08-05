"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";

type RegionalResult = {
  id: number;
  placement: number;
  fantasyPoints: number;

  player: {
    id: number;
    name: string;
    country: string;
    externalId?: string | null;
    seasonStartingRank: number;
  };
};

type RegionalEvent = {
  id: number;
  name: string;
  location: string;
  startDate: string;
  seasonWeek: number;
  status: string;
  results?: RegionalResult[];
};

export default function RegionalsPage() {
  const [events, setEvents] =
    useState<RegionalEvent[]>([]);

  const [selectedEventId, setSelectedEventId] =
    useState<number | null>(null);

  const [selectedEvent, setSelectedEvent] =
    useState<RegionalEvent | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loadingEvent, setLoadingEvent] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5255/api/regionalevents"
        );

        if (!response.ok) {
          throw new Error(
            "Could not load Regionals."
          );
        }

        const data: RegionalEvent[] =
          await response.json();

        const sorted = [...data].sort(
          (a, b) =>
            a.seasonWeek -
            b.seasonWeek
        );

        setEvents(sorted);

        if (sorted.length > 0) {
          setSelectedEventId(
            sorted[0].id
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load Regionals."
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  useEffect(() => {
    async function loadSelectedEvent() {
      if (!selectedEventId) {
        setSelectedEvent(null);
        return;
      }

      try {
        setLoadingEvent(true);

        const response = await fetch(
          `http://localhost:5255/api/regionalevents/${selectedEventId}`
        );

        if (!response.ok) {
          throw new Error(
            "Could not load Regional details."
          );
        }

        const data: RegionalEvent =
          await response.json();

        setSelectedEvent(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load Regional details."
        );
      } finally {
        setLoadingEvent(false);
      }
    }

    loadSelectedEvent();
  }, [selectedEventId]);

  const upcomingEvents =
    useMemo(
      () =>
        events.filter(
          (event) =>
            event.status === "Upcoming"
        ),
      [events]
    );

  const liveEvents =
    useMemo(
      () =>
        events.filter(
          (event) =>
            event.status === "Live"
        ),
      [events]
    );

  const finalEvents =
    useMemo(
      () =>
        events.filter(
          (event) =>
            event.status === "Final"
        ),
      [events]
    );

  function getStatusClasses(
    status: string
  ) {
    if (status === "Live") {
      return "border-red-500/40 bg-red-950/30 text-red-400";
    }

    if (status === "Final") {
      return "border-green-500/40 bg-green-950/30 text-green-400";
    }

    return "border-yellow-400/30 bg-yellow-400/5 text-yellow-400";
  }

  function formatDate(
    dateString: string
  ) {
    return new Date(
      dateString
    ).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function formatPlacement(
    placement: number
  ) {
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

  function EventCard({
    regionalEvent,
  }: {
    regionalEvent: RegionalEvent;
  }) {
    const isSelected =
      regionalEvent.id ===
      selectedEventId;

    return (
      <button
        type="button"
        onClick={() =>
          setSelectedEventId(
            regionalEvent.id
          )
        }
        className={`w-full rounded-2xl border p-5 text-left transition ${
          isSelected
            ? "border-yellow-400 bg-yellow-400/5"
            : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-yellow-400">
              Fantasy Week{" "}
              {
                regionalEvent.seasonWeek
              }
            </p>

            <h3 className="mt-1 text-xl font-black">
              {
                regionalEvent.name
              }
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              {
                regionalEvent.location
              }
            </p>

            <p className="mt-1 text-sm text-zinc-600">
              {formatDate(
                regionalEvent.startDate
              )}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${getStatusClasses(
              regionalEvent.status
            )}`}
          >
            {
              regionalEvent.status
            }
          </span>
        </div>
      </button>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
            Loading Regionals...
          </div>
        </div>
      </main>
    );
  }

  if (error && events.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-400">
            {error}
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
            Fantasy Schedule
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Regionals
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Follow upcoming events, live
            tournament scoring, and completed
            fantasy results throughout the
            season.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-400">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-zinc-500">
              Upcoming
            </p>

            <p className="mt-2 text-4xl font-black text-yellow-400">
              {
                upcomingEvents.length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-zinc-500">
              Live
            </p>

            <p className="mt-2 text-4xl font-black text-red-400">
              {
                liveEvents.length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold text-zinc-500">
              Completed
            </p>

            <p className="mt-2 text-4xl font-black text-green-400">
              {
                finalEvents.length
              }
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-12 text-center">
            <h2 className="text-2xl font-black">
              No Regionals yet
            </h2>

            <p className="mt-3 text-zinc-500">
              The fantasy schedule has not
              been created yet.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">

            {/* EVENT LIST */}

            <aside className="space-y-6">
              {liveEvents.length > 0 && (
                <section>
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-red-400">
                    Live Now
                  </p>

                  <div className="space-y-3">
                    {liveEvents.map(
                      (regionalEvent) => (
                        <EventCard
                          key={
                            regionalEvent.id
                          }
                          regionalEvent={
                            regionalEvent
                          }
                        />
                      )
                    )}
                  </div>
                </section>
              )}

              {upcomingEvents.length >
                0 && (
                <section>
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-yellow-400">
                    Upcoming
                  </p>

                  <div className="space-y-3">
                    {upcomingEvents.map(
                      (regionalEvent) => (
                        <EventCard
                          key={
                            regionalEvent.id
                          }
                          regionalEvent={
                            regionalEvent
                          }
                        />
                      )
                    )}
                  </div>
                </section>
              )}

              {finalEvents.length >
                0 && (
                <section>
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-green-400">
                    Completed
                  </p>

                  <div className="space-y-3">
                    {finalEvents.map(
                      (regionalEvent) => (
                        <EventCard
                          key={
                            regionalEvent.id
                          }
                          regionalEvent={
                            regionalEvent
                          }
                        />
                      )
                    )}
                  </div>
                </section>
              )}
            </aside>

            {/* EVENT DETAIL */}

            <section className="min-w-0">
              {loadingEvent ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-500">
                  Loading event...
                </div>
              ) : selectedEvent ? (
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                  <div className="border-b border-zinc-800 p-6 md:p-8">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                      <div>
                        <p className="text-sm font-bold text-yellow-400">
                          Fantasy Week{" "}
                          {
                            selectedEvent.seasonWeek
                          }
                        </p>

                        <h2 className="mt-2 text-3xl font-black">
                          {
                            selectedEvent.name
                          }
                        </h2>

                        <p className="mt-3 text-zinc-400">
                          {
                            selectedEvent.location
                          }
                        </p>

                        <p className="mt-1 text-sm text-zinc-600">
                          {formatDate(
                            selectedEvent.startDate
                          )}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase ${getStatusClasses(
                          selectedEvent.status
                        )}`}
                      >
                        {
                          selectedEvent.status
                        }
                      </span>
                    </div>
                  </div>

                  {selectedEvent.status ===
                  "Upcoming" ? (
                    <div className="p-8">
                      <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-8 text-center">
                        <p className="text-sm font-bold uppercase tracking-wider text-yellow-400">
                          Upcoming Regional
                        </p>

                        <h3 className="mt-3 text-2xl font-black">
                          Results will appear here
                          once the tournament begins.
                        </h3>

                        <p className="mx-auto mt-3 max-w-xl text-zinc-500">
                          Fantasy managers should submit
                          their Starting 6 before this
                          Regional moves to Live.
                        </p>
                      </div>
                    </div>
                  ) : selectedEvent.results &&
                    selectedEvent.results.length >
                      0 ? (
                    <div>
                      <div className="border-b border-zinc-800 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black">
                            Fantasy Player Results
                          </h3>

                          <span className="text-sm text-zinc-500">
                            {
                              selectedEvent.results
                                .length
                            }{" "}
                            matched players
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="border-b border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
                            <tr>
                              <th className="px-6 py-4">
                                Finish
                              </th>

                              <th className="px-6 py-4">
                                Player
                              </th>

                              <th className="px-6 py-4">
                                Country
                              </th>

                              <th className="px-6 py-4 text-center">
                                Starting Rank
                              </th>

                              <th className="px-6 py-4 text-right">
                                Fantasy Pts
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {selectedEvent.results
                              .sort(
                                (a, b) =>
                                  a.placement -
                                  b.placement
                              )
                              .map(
                                (result) => (
                                  <tr
                                    key={
                                      result.id
                                    }
                                    className="border-b border-zinc-800 last:border-b-0"
                                  >
                                    <td className="px-6 py-5 font-black text-yellow-400">
                                      {formatPlacement(
                                        result.placement
                                      )}
                                    </td>

                                    <td className="px-6 py-5 font-bold">
                                      {
                                        result.player
                                          .name
                                      }
                                    </td>

                                    <td className="px-6 py-5 text-zinc-400">
                                      {
                                        result.player
                                          .country
                                      }
                                    </td>

                                    <td className="px-6 py-5 text-center text-zinc-400">
                                      #
                                      {
                                        result.player
                                          .seasonStartingRank
                                      }
                                    </td>

                                    <td className="px-6 py-5 text-right text-lg font-black">
                                      <span
                                        className={
                                          result.fantasyPoints >
                                          0
                                            ? "text-yellow-400"
                                            : "text-zinc-500"
                                        }
                                      >
                                        {
                                          result.fantasyPoints
                                        }
                                      </span>
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8">
                      <div className="rounded-2xl border border-zinc-800 bg-black p-8 text-center">
                        <h3 className="text-xl font-black">
                          No results imported yet
                        </h3>

                        <p className="mt-3 text-zinc-500">
                          This Regional is{" "}
                          {
                            selectedEvent.status
                          }
                          , but fantasy results have
                          not been imported yet.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-500">
                  Select a Regional to view
                  details.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}