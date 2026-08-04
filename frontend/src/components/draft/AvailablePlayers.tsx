"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Player } from "@/types/draft";

type AvailablePlayersProps = {
  players: Player[];
  onDraft: (player: Player) => void;
};

export default function AvailablePlayers({
  players,
  onDraft,
}: AvailablePlayersProps) {
  const [search, setSearch] = useState("");

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-6">
        <h2 className="text-2xl font-bold">
          Available Players
        </h2>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-black px-4">
          <Search size={18} className="text-zinc-500" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="w-full bg-transparent py-3 text-white outline-none placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div>
        {filteredPlayers.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 last:border-b-0"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-yellow-400">
                  #{player.rank}
                </span>

                <h3 className="font-bold text-white">
                  {player.name}
                </h3>
              </div>

              <p className="mt-1 text-sm text-zinc-500">
                {player.country} • {player.championshipPoints} CP
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="hidden text-right sm:block">
                <p className="font-bold">
                  {player.fantasyPoints}
                </p>

                <p className="text-xs text-zinc-500">
                  Fantasy Pts
                </p>
              </div>

              <button
                onClick={() => onDraft(player)}
                className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-black transition hover:bg-yellow-300"
              >
                Draft
              </button>
            </div>
          </div>
        ))}

        {filteredPlayers.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            No available players found.
          </div>
        )}
      </div>
    </section>
  );
}