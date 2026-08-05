"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  useSearchParams,
  useRouter,
} from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { apiFetch } from "@/lib/api";

type Player = {
  id: number;
  name: string;
  country: string;
  seasonStartingRank: number;
  seasonPoolOrder: number;
  fantasyPoints: number;
  recentFinish: string;
};

type Roster = {
  team: {
    id: number;
    name: string;
    isCommissioner: boolean;
  };
  players: Player[];
};

type RegionalEvent = {
  id: number;
  name: string;
  location: string;
  startDate: string;
  seasonWeek: number;
  status: string;
};

export default function LineupPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const leagueId = params.id as string;
  const teamId = searchParams.get("teamId");
  const eventId = searchParams.get("eventId");

  const [teamName, setTeamName] =
    useState("");

  const [roster, setRoster] =
    useState<Player[]>([]);

  const [regionalEvent, setRegionalEvent] =
    useState<RegionalEvent | null>(null);

  const [
    selectedPlayerIds,
    setSelectedPlayerIds,
  ] = useState<number[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadLineupPage() {
      if (!teamId || !eventId) {
        setError(
          "Missing team or Regional."
        );

        setLoading(false);
        return;
      }

      try {
        /*
         * Load:
         *
         * 1. League rosters
         * 2. Regional event
         * 3. This team's protected lineup
         *
         * The lineup request uses apiFetch()
         * so the JWT is included.
         */
        const [
          rostersResponse,
          eventResponse,
          lineupResponse,
        ] = await Promise.all([
          apiFetch(
  `/api/leagues/${leagueId}/rosters`
),

apiFetch(
  `/api/regionalevents/${eventId}`
),

          apiFetch(
            `/api/lineups/team/${teamId}/event/${eventId}`
          ),
        ]);

        if (!rostersResponse.ok) {
          throw new Error(
            "Could not load roster."
          );
        }

        if (!eventResponse.ok) {
          throw new Error(
            "Could not load Regional."
          );
        }

        /*
         * If the user is not logged in,
         * send them back to login.
         */
        if (
          lineupResponse.status === 401
        ) {
          router.push("/login");
          return;
        }

        /*
         * If they manually changed teamId
         * to another manager's team, the
         * backend returns 403.
         */
        if (
          lineupResponse.status === 403
        ) {
          throw new Error(
            "You do not have permission to view or edit this team's lineup."
          );
        }

        if (!lineupResponse.ok) {
          const text =
            await lineupResponse.text();

          throw new Error(
            text ||
              "Could not load lineup."
          );
        }

        const rosters: Roster[] =
          await rostersResponse.json();

        const eventData: RegionalEvent =
          await eventResponse.json();

        const lineupData: Player[] =
          await lineupResponse.json();

        /*
         * Find this fantasy team's
         * permanent roster.
         */
        const teamRoster =
          rosters.find(
            (roster) =>
              roster.team.id ===
              Number(teamId)
          );

        if (!teamRoster) {
          throw new Error(
            "This team was not found in the league."
          );
        }

        setTeamName(
          teamRoster.team.name
        );

        setRoster(
          teamRoster.players
        );

        setRegionalEvent(
          eventData
        );

        /*
         * Restore the previously
         * submitted Starting 6.
         */
        setSelectedPlayerIds(
          lineupData.map(
            (player) => player.id
          )
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load lineup."
        );
      } finally {
        setLoading(false);
      }
    }

    loadLineupPage();
  }, [
    leagueId,
    teamId,
    eventId,
    router,
  ]);

  /*
   * Upcoming = editable
   * Live/Final = locked
   */
  const isLocked =
    regionalEvent?.status !==
    "Upcoming";

  /*
   * Players currently selected
   * as the Starting 6.
   */
  const selectedPlayers =
    useMemo(
      () =>
        roster.filter(
          (player) =>
            selectedPlayerIds.includes(
              player.id
            )
        ),
      [
        roster,
        selectedPlayerIds,
      ]
    );

  /*
   * Everyone else on the
   * permanent roster.
   */
  const benchPlayers =
    useMemo(
      () =>
        roster.filter(
          (player) =>
            !selectedPlayerIds.includes(
              player.id
            )
        ),
      [
        roster,
        selectedPlayerIds,
      ]
    );

  function togglePlayer(
    playerId: number
  ) {
    if (isLocked) {
      return;
    }

    setMessage("");
    setError("");

    setSelectedPlayerIds(
      (previous) => {
        /*
         * Clicking a starter moves
         * them back to the bench.
         */
        if (
          previous.includes(playerId)
        ) {
          return previous.filter(
            (id) =>
              id !== playerId
          );
        }

        /*
         * Starting lineup cannot
         * exceed six players.
         */
        if (
          previous.length >= 6
        ) {
          return previous;
        }

        return [
          ...previous,
          playerId,
        ];
      }
    );
  }

  async function saveLineup() {
    if (!teamId || !eventId) {
      return;
    }

    if (
      selectedPlayerIds.length !== 6
    ) {
      setError(
        "You must select exactly 6 players."
      );

      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      /*
       * apiFetch attaches the JWT.
       *
       * The backend then verifies
       * that the logged-in user
       * actually owns teamId.
       */
      const response =
        await apiFetch(
          `/api/lineups/team/${teamId}/event/${eventId}`,
          {
            method: "PUT",

            body: JSON.stringify({
              playerIds:
                selectedPlayerIds,
            }),
          }
        );

      if (
        response.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (
        response.status === 403
      ) {
        throw new Error(
          "You do not have permission to edit this team's lineup."
        );
      }

      if (!response.ok) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Could not save lineup."
        );
      }

      setMessage(
        "Regional lineup saved successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save lineup."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-6 py-12 text-zinc-400">
          Loading lineup...
        </div>
      </main>
    );
  }

  /*
   * Fatal loading/access error.
   */
  if (
    error &&
    !regionalEvent
  ) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-400">
            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/league/${leagueId}`
                )
              }
              className="mt-5 rounded-xl border border-red-800 px-5 py-2 font-bold text-white transition hover:border-red-500"
            >
              Back to League
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
              Regional Lineup
            </p>

            <h1 className="mt-2 text-4xl font-black">
              {teamName}
            </h1>

            <p className="mt-3 text-zinc-400">
              {regionalEvent?.name}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Week{" "}
              {
                regionalEvent?.seasonWeek
              }{" "}
              ·{" "}
              {
                regionalEvent?.location
              }
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-center">
            <p className="text-sm text-zinc-500">
              Selected
            </p>

            <p
              className={`mt-1 text-3xl font-black ${
                selectedPlayerIds.length ===
                6
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {
                selectedPlayerIds.length
              }
              /6
            </p>
          </div>
        </div>

        {/* Locked warning */}
        {isLocked && (
          <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-zinc-300">
            🔒 This lineup is locked
            because the Regional is{" "}
            <span className="font-bold">
              {
                regionalEvent?.status
              }
            </span>
            .
          </div>
        )}

        {/* Success */}
        {message && (
          <div className="mt-6 rounded-xl border border-green-900 bg-green-950/30 p-4 text-green-400">
            {message}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Starting 6 */}
        <section className="mt-8">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
              Starting Lineup
            </p>

            <h2 className="mt-1 text-3xl font-black">
              Starting 6
            </h2>
          </div>

          {selectedPlayers.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center text-zinc-500">
              Select players from
              your bench below.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedPlayers.map(
                (player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() =>
                      togglePlayer(
                        player.id
                      )
                    }
                    disabled={
                      isLocked
                    }
                    className="rounded-2xl border border-yellow-400 bg-yellow-400/10 p-5 text-left transition hover:bg-yellow-400/20 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-yellow-400">
                          #
                          {
                            player.seasonStartingRank
                          }
                        </p>

                        <h3 className="mt-1 text-lg font-black">
                          {
                            player.name
                          }
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {
                            player.country
                          }
                        </p>
                      </div>

                      <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black">
                        START
                      </span>
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </section>

        {/* Bench */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Permanent Roster
            </p>

            <h2 className="mt-1 text-3xl font-black">
              Bench
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {benchPlayers.map(
              (player) => {
                const lineupFull =
                  selectedPlayerIds.length >=
                  6;

                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() =>
                      togglePlayer(
                        player.id
                      )
                    }
                    disabled={
                      isLocked ||
                      lineupFull
                    }
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left transition hover:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-yellow-400">
                          #
                          {
                            player.seasonStartingRank
                          }
                        </p>

                        <h3 className="mt-1 text-lg font-black">
                          {
                            player.name
                          }
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {
                            player.country
                          }
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-zinc-500">
                        Add
                      </span>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="sticky bottom-0 mt-10 border-t border-zinc-800 bg-black/95 py-5 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/league/${leagueId}`
                )
              }
              className="rounded-xl border border-zinc-700 px-6 py-3 font-bold text-zinc-300 transition hover:border-zinc-500"
            >
              Back to League
            </button>

            <button
              type="button"
              onClick={
                saveLineup
              }
              disabled={
                isLocked ||
                saving ||
                selectedPlayerIds.length !==
                  6
              }
              className="rounded-xl bg-yellow-400 px-8 py-3 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? "Saving..."
                : "Save Starting 6"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}