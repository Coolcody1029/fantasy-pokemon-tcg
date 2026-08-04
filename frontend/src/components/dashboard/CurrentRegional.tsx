export default function CurrentRegional() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm font-semibold text-yellow-400">
        Current Event
      </p>

      <h2 className="mt-2 text-xl font-bold">
        Toronto Regional
      </h2>

      <p className="mt-1 text-sm text-zinc-500">
        Round 7 of 9
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-zinc-400">
            Players Remaining
          </span>

          <span className="font-bold">
            184
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">
            Your Players Active
          </span>

          <span className="font-bold text-green-400">
            3
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">
            Next Round
          </span>

          <span className="font-bold">
            28 min
          </span>
        </div>
      </div>

      <button className="mt-6 w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300">
        View Live Event
      </button>
    </section>
  );
}