export default function MatchupCard() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-yellow-400">
            Week 3 Matchup
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Toronto Regional
          </h2>
        </div>

        <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400">
          Live
        </span>
      </div>

      <div className="mt-8 grid grid-cols-3 items-center text-center">
        <div>
          <p className="text-sm text-zinc-500">
            Your Team
          </p>

          <h3 className="mt-2 text-xl font-bold">
            Cody
          </h3>

          <p className="mt-3 text-4xl font-black text-yellow-400">
            142.5
          </p>
        </div>

        <div className="text-zinc-600">
          VS
        </div>

        <div>
          <p className="text-sm text-zinc-500">
            Opponent
          </p>

          <h3 className="mt-2 text-xl font-bold">
            Team Rocket
          </h3>

          <p className="mt-3 text-4xl font-black">
            118.0
          </p>
        </div>
      </div>

      <div className="mt-8 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full w-[55%] rounded-full bg-yellow-400" />
      </div>

      <p className="mt-3 text-center text-sm text-zinc-500">
        Projected win chance: 55%
      </p>
    </section>
  );
}