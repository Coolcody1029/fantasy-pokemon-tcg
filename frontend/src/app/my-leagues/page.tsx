"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { apiFetch } from "@/lib/api";

type MyLeague = {
  league: {
    id: number;
    name: string;
    inviteCode: string;
    maxTeams: number;
    memberCount: number;
  };

  team: {
    id: number;
    name: string;
    isCommissioner: boolean;
  };
};

export default function MyLeaguesPage() {
  const router = useRouter();

  const [leagues, setLeagues] = useState<MyLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeagues() {
      try {
        const response = await apiFetch(
          "/api/leagues/mine"
        );

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Could not load your leagues."
          );
        }

        const data: MyLeague[] =
          await response.json();

        setLeagues(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load your leagues."
        );
      } finally {
        setLoading(false);
      }
    }

    loadLeagues();
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
            Fantasy TCG
          </p>

          <h1 className="mt-2 text-4xl font-black">
            My Leagues
          </h1>

          <p className="mt-3 text-zinc-400">
            Leagues and fantasy teams connected to your account.
          </p>
        </div>

        {loading && (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
            Loading your leagues...
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-400">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          leagues.length === 0 && (
            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
              <h2 className="text-2xl font-black">
                No leagues yet
              </h2>

              <p className="mt-2 text-zinc-500">
                Create a league or join one with an invite code.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() =>
                    router.push("/create-league")
                  }
                  className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black"
                >
                  Create League
                </button>

                <button
                  onClick={() =>
                    router.push("/join-league")
                  }
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-bold"
                >
                  Join League
                </button>
              </div>
            </div>
          )}

        {!loading &&
          !error &&
          leagues.length > 0 && (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {leagues.map((item) => (
                <button
                  key={item.league.id}
                  onClick={() =>
                    router.push(
                      `/league/${item.league.id}`
                    )
                  }
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left transition hover:border-yellow-400"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-yellow-400">
                        {item.team.isCommissioner
                          ? "Commissioner"
                          : "League Member"}
                      </p>

                      <h2 className="mt-2 text-2xl font-black">
                        {item.league.name}
                      </h2>

                      <p className="mt-2 text-zinc-400">
                        Team:{" "}
                        <span className="font-semibold text-white">
                          {item.team.name}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black">
                        {item.league.memberCount}
                        <span className="text-zinc-600">
                          /
                          {item.league.maxTeams}
                        </span>
                      </p>

                      <p className="text-xs text-zinc-500">
                        Teams
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-zinc-800 pt-4">
                    <p className="text-sm text-zinc-500">
                      Invite Code
                    </p>

                    <p className="mt-1 font-black tracking-widest text-yellow-400">
                      {item.league.inviteCode}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
      </div>
    </main>
  );
}