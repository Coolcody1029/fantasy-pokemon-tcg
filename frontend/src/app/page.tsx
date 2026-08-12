"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Navbar from "@/components/layout/Navbar";
import { getCurrentUser } from "@/lib/api";

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
};

export default function Home() {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [
    loadingUser,
    setLoadingUser,
  ] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  const createLeagueHref =
    loadingUser
      ? "/login"
      : user
        ? "/create-league"
        : "/login";

  const joinLeagueHref =
    loadingUser
      ? "/login"
      : user
        ? "/join-league"
        : "/login";

  const myLeaguesHref =
    loadingUser
      ? "/login"
      : user
        ? "/my-leagues"
        : "/login";

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* HERO */}
      <section className="border-b border-zinc-900">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/5 px-4 py-2 text-sm font-bold text-yellow-400">
              Fantasy Pokémon TCG
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-6xl">
              Build your team.
              <br />
              Follow Regionals.
              <br />
              <span className="text-yellow-400">
                Win your league.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              Draft real competitive Pokémon TCG players,
              choose your Starting 6 for each Regional, and
              earn fantasy points based on their real tournament
              finishes.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={createLeagueHref}
                className="rounded-xl bg-yellow-400 px-7 py-4 font-black text-black transition hover:bg-yellow-300"
              >
                Create League
              </Link>

              <Link
                href={joinLeagueHref}
                className="rounded-xl border border-zinc-700 px-7 py-4 font-bold text-white transition hover:border-yellow-400"
              >
                Join League
              </Link>

              <Link
                href={myLeaguesHref}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-7 py-4 font-bold text-zinc-300 transition hover:border-zinc-600 hover:text-white"
              >
                My Leagues
              </Link>
            </div>
          </div>

          {/* MOCK MATCHUP CARD */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-yellow-400/5 blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
              <div className="border-b border-zinc-800 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-yellow-400">
                      Fantasy Week 4
                    </p>

                    <p className="mt-1 font-black">
                      Regional Matchup
                    </p>
                  </div>

                  <span className="rounded-full border border-red-500/30 bg-red-950/30 px-3 py-1 text-xs font-black text-red-400">
                    LIVE
                  </span>
                </div>
              </div>

              <div className="p-7">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5">
                  <div className="text-right">
                    <p className="text-sm text-yellow-400">
                      Your Team
                    </p>

                    <p className="mt-1 text-xl font-black">
                      Victory Road
                    </p>

                    <p className="mt-3 text-5xl font-black text-yellow-400">
                      96
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-black text-xs font-black text-zinc-500">
                    VS
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      Opponent
                    </p>

                    <p className="mt-1 text-xl font-black">
                      Rare Candy
                    </p>

                    <p className="mt-3 text-5xl font-black">
                      84
                    </p>
                  </div>
                </div>

                <div className="mt-7 border-t border-zinc-800 pt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">
                      Starting 6
                    </span>

                    <span className="font-bold text-green-400">
                      Lineup Ready ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-yellow-400">
            How It Works
          </p>

          <h2 className="mt-2 text-4xl font-black">
            Fantasy sports for competitive Pokémon.
          </h2>

          <p className="mt-4 text-zinc-400">
            Your fantasy roster succeeds when your drafted
            Pokémon TCG players succeed at real events.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-xl font-black text-black">
              1
            </div>

            <h3 className="mt-5 text-xl font-black">
              Draft
            </h3>

            <p className="mt-2 leading-6 text-zinc-500">
              Snake draft competitive players from the
              fantasy player pool.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-xl font-black text-black">
              2
            </div>

            <h3 className="mt-5 text-xl font-black">
              Set Your 6
            </h3>

            <p className="mt-2 leading-6 text-zinc-500">
              Choose six players from your roster to start
              for each Regional.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-xl font-black text-black">
              3
            </div>

            <h3 className="mt-5 text-xl font-black">
              Follow Regionals
            </h3>

            <p className="mt-2 leading-6 text-zinc-500">
              Real tournament placements are converted into
              fantasy points.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-xl font-black text-black">
              4
            </div>

            <h3 className="mt-5 text-xl font-black">
              Win Matchups
            </h3>

            <p className="mt-2 leading-6 text-zinc-500">
              Your Starting 6 scores against another manager
              every fantasy week.
            </p>
          </div>
        </div>
      </section>

      {/* SCORING */}
      <section className="border-y border-zinc-900 bg-zinc-950/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-yellow-400">
              Real Results
            </p>

            <h2 className="mt-2 text-4xl font-black">
              Their finish becomes your score.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-zinc-400">
              Fantasy points are based on how your players
              perform at real Pokémon TCG events. Only the six
              players you start for that event contribute to
              your matchup.
            </p>

            <Link
              href="/regionals"
              className="mt-7 inline-flex rounded-xl border border-yellow-400 px-6 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              View Regionals
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-6 py-4">
              <p className="font-black">
                Example Fantasy Scoring
              </p>
            </div>

            <div className="divide-y divide-zinc-800">
              {[
                ["1st", "35"],
                ["2nd", "32"],
                ["3rd – 4th", "30"],
                ["5th – 8th", "28"],
                ["9th – 16th", "20"],
                ["17th – 32nd", "16"],
              ].map(
                ([finish, points]) => (
                  <div
                    key={finish}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <span className="font-semibold text-zinc-300">
                      {finish}
                    </span>

                    <span className="font-black text-yellow-400">
                      {points} pts
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* EXPLORE */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-yellow-400">
            Explore
          </p>

          <h2 className="mt-2 text-4xl font-black">
            Follow the fantasy season.
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Link
            href="/players"
            className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-7 transition hover:border-yellow-400"
          >
            <p className="text-sm font-bold text-yellow-400">
              Player Pool
            </p>

            <h3 className="mt-2 text-2xl font-black">
              Players
            </h3>

            <p className="mt-3 text-zinc-500">
              Browse the competitive players available across
              fantasy leagues.
            </p>

            <p className="mt-6 font-bold text-zinc-300 transition group-hover:text-yellow-400">
              View Players →
            </p>
          </Link>

          <Link
            href="/regionals"
            className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-7 transition hover:border-yellow-400"
          >
            <p className="text-sm font-bold text-yellow-400">
              Tournament Calendar
            </p>

            <h3 className="mt-2 text-2xl font-black">
              Regionals
            </h3>

            <p className="mt-3 text-zinc-500">
              See upcoming events, live tournaments, and
              completed fantasy results.
            </p>

            <p className="mt-6 font-bold text-zinc-300 transition group-hover:text-yellow-400">
              View Regionals →
            </p>
          </Link>

          <Link
            href={myLeaguesHref}
            className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-7 transition hover:border-yellow-400"
          >
            <p className="text-sm font-bold text-yellow-400">
              Your Fantasy Teams
            </p>

            <h3 className="mt-2 text-2xl font-black">
              My Leagues
            </h3>

            <p className="mt-3 text-zinc-500">
              Manage lineups, follow matchups, and chase the
              top spot in your leagues.
            </p>

            <p className="mt-6 font-bold text-zinc-300 transition group-hover:text-yellow-400">
              Open Leagues →
            </p>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/5 px-6 py-12 text-center md:px-12">
            <p className="text-sm font-bold uppercase tracking-wider text-yellow-400">
              Build Your League
            </p>

            <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black">
              Think you know which Pokémon TCG players will
              dominate the season?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-zinc-400">
              Draft them before your friends do and prove it
              across a full fantasy season.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href={createLeagueHref}
                className="rounded-xl bg-yellow-400 px-7 py-4 font-black text-black transition hover:bg-yellow-300"
              >
                Create a League
              </Link>

              <Link
                href={joinLeagueHref}
                className="rounded-xl border border-zinc-700 px-7 py-4 font-bold transition hover:border-yellow-400"
              >
                Join with Code
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-8">
  <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-zinc-600 sm:flex-row">
    <p>Fantasy Pokémon TCG</p>

    <div className="flex items-center gap-6">
      <a
        href="https://www.linkedin.com/in/cody-criner-8029a6294/"
        target="_blank"
        rel="noopener noreferrer"
        className="transition hover:text-yellow-400"
      >
        LinkedIn
      </a>

      <a
        href="https://x.com/Coolcody171"
        target="_blank"
        rel="noopener noreferrer"
        className="transition hover:text-yellow-400"
      >
        X
      </a>

      <a
        href="https://discord.gg/c3aG4YQYAT"
        target="_blank"
        rel="noopener noreferrer"
        className="transition hover:text-yellow-400"
      >
        Discord
      </a>
    </div>
  </div>
</footer>
    </main>
  );
}