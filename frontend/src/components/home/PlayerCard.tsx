type PlayerCardProps = {
  name: string;
  country: string;
  championshipPoints: number;
  fantasyPoints: number;
  rank: number;
};

export default function PlayerCard({
  name,
  country,
  championshipPoints,
  fantasyPoints,
  rank,
}: PlayerCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg transition hover:-translate-y-1 hover:border-yellow-400">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-yellow-400">
            Fantasy Rank #{rank}
          </p>

          <h3 className="mt-1 text-xl font-bold text-white">
            {name}
          </h3>

          <p className="text-sm text-zinc-400">
            {country}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 font-bold text-black">
          #{rank}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-zinc-800 p-3">
          <p className="text-xs text-zinc-400">
            Championship Points
          </p>

          <p className="mt-1 text-lg font-bold text-white">
            {championshipPoints}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-800 p-3">
          <p className="text-xs text-zinc-400">
            Fantasy Points
          </p>

          <p className="mt-1 text-lg font-bold text-white">
            {fantasyPoints}
          </p>
        </div>
      </div>

      <button className="mt-5 w-full rounded-xl bg-yellow-400 py-2.5 font-bold text-black transition hover:bg-yellow-300">
        View Player
      </button>
    </div>
  );
}