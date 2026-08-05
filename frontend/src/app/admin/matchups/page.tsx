"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Navbar from "@/components/layout/Navbar";

import {
  apiFetch,
  getCurrentUser,
} from "@/lib/api";

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
};

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
  const router = useRouter();

  const [
    checkingAdmin,
    setCheckingAdmin,
  ] = useState(true);

  const [
    leagueId,
    setLeagueId,
  ] = useState("");

  const [
    league,
    setLeague,
  ] = useState<League | null>(null);

  const [
    events,
    setEvents,
  ] = useState<RegionalEvent[]>([]);

  const [
    regionalEventId,
    setRegionalEventId,
  ] = useState("");

  const [
    teamOneId,
    setTeamOneId,
  ] = useState("");

  const [
    teamTwoId,
    setTeamTwoId,
  ] = useState("");

  const [
    loadingLeague,
    setLoadingLeague,
  ] = useState(false);

  const [
    creatingMatchup,
    setCreatingMatchup,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  /*
   * ---------------------------------------
   * ADMIN ACCESS CHECK
   * ---------------------------------------
   *
   * Only the configured application admin
   * may view this page.
   */
  useEffect(() => {
    async function loadPage() {
      try {
        const currentUser =
          (await getCurrentUser()) as
            | CurrentUser
            | null;

        if (!currentUser) {
          router.replace(
            "/login"
          );

          return;
        }

        if (!currentUser.isAdmin) {
          router.replace(
            "/"
          );

          return;
        }

        /*
         * Only load admin page data after
         * the admin check succeeds.
         */
        const response =
        await apiFetch(
          "/api/regionalevents"
         );

        if (!response.ok) {
          throw new Error(
            "Could not load Regionals."
          );
        }

        const data:
          RegionalEvent[] =
            await response.json();

        setEvents(
          data
        );

        if (
          data.length > 0
        ) {
          setRegionalEventId(
            String(
              data[0].id
            )
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load admin page."
        );
      } finally {
        setCheckingAdmin(
          false
        );
      }
    }

    loadPage();
  }, [router]);

  /*
   * ---------------------------------------
   * LOAD LEAGUE
   * ---------------------------------------
   */
  async function loadLeague() {
    if (!leagueId) {
      setError(
        "Enter a league ID."
      );

      return;
    }

    setError("");
    setMessage("");
    setLeague(null);
    setLoadingLeague(true);

    try {
      /*
       * This endpoint is protected and
       * requires league membership.
       */
      const response =
        await apiFetch(
          `/api/leagues/${leagueId}`
        );

      if (
        response.status ===
        401
      ) {
        router.replace(
          "/login"
        );

        return;
      }

      if (
        response.status ===
        403
      ) {
        throw new Error(
          "You are not a member of this league."
        );
      }

      if (
        !response.ok
      ) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "League not found."
        );
      }

      const data:
        League =
          await response.json();

      setLeague(
        data
      );

      if (
        data.members.length >=
        2
      ) {
        setTeamOneId(
          String(
            data.members[0].id
          )
        );

        setTeamTwoId(
          String(
            data.members[1].id
          )
        );
      } else {
        setTeamOneId("");
        setTeamTwoId("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load league."
      );
    } finally {
      setLoadingLeague(
        false
      );
    }
  }

  /*
   * ---------------------------------------
   * CREATE MATCHUP
   * ---------------------------------------
   */
  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !leagueId ||
      !regionalEventId ||
      !teamOneId ||
      !teamTwoId
    ) {
      setError(
        "League, Regional, Team One, and Team Two are required."
      );

      return;
    }

    if (
      teamOneId ===
      teamTwoId
    ) {
      setError(
        "A team cannot play against itself."
      );

      return;
    }

    setCreatingMatchup(
      true
    );

    try {
      /*
       * This endpoint is authenticated.
       * The backend still determines whether
       * the user is allowed to create it.
       */
      const response =
        await apiFetch(
          "/api/matchups",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                leagueId:
                  Number(
                    leagueId
                  ),

                regionalEventId:
                  Number(
                    regionalEventId
                  ),

                teamOneId:
                  Number(
                    teamOneId
                  ),

                teamTwoId:
                  Number(
                    teamTwoId
                  ),
              }),
          }
        );

      if (
        response.status ===
        401
      ) {
        router.replace(
          "/login"
        );

        return;
      }

      if (
        response.status ===
        403
      ) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "You are not allowed to create this matchup."
        );
      }

      if (
        !response.ok
      ) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Could not create matchup."
        );
      }

      setMessage(
        "Matchup created successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create matchup."
      );
    } finally {
      setCreatingMatchup(
        false
      );
    }
  }

  /*
   * ---------------------------------------
   * ADMIN CHECK SCREEN
   * ---------------------------------------
   */
  if (checkingAdmin) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="mx-auto max-w-4xl px-6 py-12">
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

      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* HEADER */}

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Create Matchup
          </h1>

          <p className="mt-3 text-zinc-400">
            Manually create a fantasy matchup
            for a Regional event.
          </p>
        </div>

        {/* MESSAGES */}

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

        {/* LOAD LEAGUE */}

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm font-semibold text-yellow-400">
            League
          </p>

          <h2 className="mt-1 text-2xl font-black">
            Load League
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Enter the league ID whose
            teams you want to schedule.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={
                leagueId
              }
              onChange={(e) => {
                setLeagueId(
                  e.target.value
                );

                setLeague(
                  null
                );
              }}
              type="number"
              min={1}
              placeholder="League ID"
              className="flex-1 rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
            />

            <button
              type="button"
              onClick={
                loadLeague
              }
              disabled={
                loadingLeague ||
                !leagueId
              }
              className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loadingLeague
                ? "Loading..."
                : "Load League"}
            </button>
          </div>
        </section>

        {/* MATCHUP FORM */}

        {league && (
          <form
            onSubmit={
              handleSubmit
            }
            className="mt-6 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <div>
              <p className="text-sm font-semibold text-yellow-400">
                Selected League
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {
                  league.name
                }
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                {
                  league.members
                    .length
                }{" "}
                teams
              </p>
            </div>

            {league.members.length <
            2 ? (
              <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-400">
                At least two teams are required
                to create a matchup.
              </div>
            ) : (
              <>
                {/* REGIONAL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Regional
                  </label>

                  <select
                    value={
                      regionalEventId
                    }
                    onChange={(e) =>
                      setRegionalEventId(
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

                {/* TEAM ONE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Team One
                  </label>

                  <select
                    value={
                      teamOneId
                    }
                    onChange={(e) =>
                      setTeamOneId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                  >
                    {league.members.map(
                      (member) => (
                        <option
                          key={
                            member.id
                          }
                          value={
                            member.id
                          }
                        >
                          {
                            member.teamName
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* TEAM TWO */}

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Team Two
                  </label>

                  <select
                    value={
                      teamTwoId
                    }
                    onChange={(e) =>
                      setTeamTwoId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                  >
                    {league.members.map(
                      (member) => (
                        <option
                          key={
                            member.id
                          }
                          value={
                            member.id
                          }
                        >
                          {
                            member.teamName
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={
                    creatingMatchup ||
                    events.length === 0
                  }
                  className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creatingMatchup
                    ? "Creating..."
                    : "Create Matchup"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </main>
  );
}