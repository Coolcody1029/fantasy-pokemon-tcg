"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

type Player = {
  id: number;
  name: string;
  country: string;
  seasonStartingRank: number;
  fantasyPoints: number;
  recentFinish: string;
};

export default function PlayersBrowser() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All Countries");
  const [sortBy, setSortBy] = useState("Starting Rank");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlayers() {
      try {
        const response = await fetch("http://localhost:5255/api/players");

        if (!response.ok) {
          throw new Error("Failed to load players");
        }

        const data: Player[] = await response.json();
        setPlayers(data);
      } catch {
        setError("Could not connect to the player API.");
      } finally {
        setLoading(false);
      }
    }

    loadPlayers();
  }, []);

  const countries = useMemo(() => {
    return [
      "All Countries",
      ...Array.from(new Set(players.map((player) => player.country))),
    ];
  }, [players]);

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (search.trim()) {
      result = result.filter((player) =>
        player.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (country !== "All Countries") {
      result = result.filter((player) => player.country === country);
    }

    if (sortBy === "Starting Rank") {
      result.sort(
        (a, b) => a.seasonStartingRank - b.seasonStartingRank
      );
    }

    if (sortBy === "Fantasy Points") {
      result.sort((a, b) => b.fantasyPoints - a.fantasyPoints);
    }

    return result;
  }, [players, search, country, sortBy]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-400">
        Loading players...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4">
          <Search size={18} className="text-zinc-500" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search players..."
            className="w-full bg-transparent py-3 text-white outline-none placeholder:text-zinc-600"
          />
        </div>

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none"
        >
          {countries.map((countryOption) => (
            <option key={countryOption} value={countryOption}>
              {countryOption}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none"
        >
          <option value="Starting Rank">Starting Rank</option>
          <option value="Fantasy Points">Fantasy Points</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
              <tr>
                <th className="px-6 py-4">Starting Rank</th>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Fantasy Points</th>
                <th className="px-6 py-4">Recent Finish</th>
              </tr>
            </thead>

            <tbody>
              {filteredPlayers.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-zinc-800 transition last:border-b-0 hover:bg-zinc-800/50"
                >
                  <td className="px-6 py-5 font-bold text-yellow-400">
                    #{player.seasonStartingRank}
                  </td>

                  <td className="px-6 py-5 font-bold text-white">
                    {player.name}
                  </td>

                  <td className="px-6 py-5 text-zinc-400">
                    {player.country}
                  </td>

                  <td className="px-6 py-5 font-bold text-white">
                    {player.fantasyPoints}
                  </td>

                  <td className="px-6 py-5 text-zinc-300">
                    {player.recentFinish || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPlayers.length === 0 && (
          <div className="p-10 text-center text-zinc-500">
            No players found.
          </div>
        )}
      </div>
    </div>
  );
}