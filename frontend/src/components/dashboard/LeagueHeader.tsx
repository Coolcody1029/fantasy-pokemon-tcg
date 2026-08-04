export default function LeagueHeader() {
  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
        My League
      </p>

      <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-black">
            Pallet Town Champions
          </h1>

          <p className="mt-2 text-zinc-400">
            2026 Competitive Season
          </p>
        </div>

        <div className="flex gap-3">
          <button className="rounded-xl border border-zinc-700 px-4 py-2 font-semibold hover:border-yellow-400">
            League Settings
          </button>

          <button className="rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black hover:bg-yellow-300">
            View Draft
          </button>
        </div>
      </div>
    </section>
  );
}