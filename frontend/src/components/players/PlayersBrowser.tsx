"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

const players = [
  {
    rank: 1,
    name: "Tord Reklev",
    country: "Norway",
    cp: 850,
    fantasyPoints: 412,
    recentFinish: "Top 4",
    trend: "up",
  },
  {
    rank: 2,
    name: "Azul Garcia Griego",
    country: "United States",
    cp: 790,
    fantasyPoints: 389,
    recentFinish: "Top 8",
    trend: "up",
  },
  {
    rank: 3,
    name: "Isaiah Bradner",
    country: "United States",
    cp: 735,
    fantasyPoints: 361,
    recentFinish: "Top 16",
    trend: "same",
  },
  {
    rank: 4,
    name: "Rahul Reddy",
    country: "United States",
    cp: 701,
    fantasyPoints: 344,
    recentFinish: "Top 32",
    trend: "down",
  },
  {
    rank: 5,
    name: "Pedro Torres",
    country: "Spain",
    cp: 682,
    fantasyPoints: 329,
    recentFinish: "Top 8",
    trend: "up",
  },
  {
    rank: 6,
    name: "Caleb Gedemer",
    country: "United States",
    cp: 655,
    fantasyPoints: 310,
    recentFinish: "Top 64",
    trend: "down",
  },
];

export default function PlayersBrowser() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All Countries");
  const [sortBy, setSortBy] = useState("Fantasy Rank");

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

    if (sortBy === "Fantasy Rank") {
      result.sort((a, b) => a.rank - b.rank);
    }

    if (sortBy === "Championship Points") {
      result.sort((a, b) => b.cp - a.cp);
    }

    if (sortBy === "Fantasy Points") {
      result.sort((a, b) => b.fantasyPoints - a.fantasyPoints);
    }

    return result;
  }, [search, country, sortBy]);

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
          <option>All Countries</option>
          <option>United States</option>
          <option>Norway</option>
          <option>Spain</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none"
        >
          <option>Fantasy Rank</option>
          <option>Championship Points</option>
          <option>Fantasy Points</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">CP</th>
                <th className="px-6 py-4">Fantasy Points</th>
                <th className="px-6 py-4">Recent Finish</th>
                <th className="px-6 py-4">Trend</th>
              </tr>
            </thead>

            <tbody>
              {filteredPlayers.map((player) => (
                <tr
                  key={player.name}
                  className="border-b border-zinc-800 transition last:border-b-0 hover:bg-zinc-800/50"
                >
                  <td className="px-6 py-5 font-bold text-yellow-400">
                    #{player.rank}
                  </td>

                  <td className="px-6 py-5 font-bold text-white">
                    {player.name}
                  </td>

                  <td className="px-6 py-5 text-zinc-400">
                    {player.country}
                  </td>

                  <td className="px-6 py-5 text-zinc-300">
                    {player.cp}
                  </td>

                  <td className="px-6 py-5 font-bold text-white">
                    {player.fantasyPoints}
                  </td>

                  <td className="px-6 py-5 text-zinc-300">
                    {player.recentFinish}
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={
                        player.trend === "up"
                          ? "text-green-400"
                          : player.trend === "down"
                          ? "text-red-400"
                          : "text-zinc-400"
                      }
                    >
                      {player.trend === "up"
                        ? "↑"
                        : player.trend === "down"
                        ? "↓"
                        : "→"}
                    </span>
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