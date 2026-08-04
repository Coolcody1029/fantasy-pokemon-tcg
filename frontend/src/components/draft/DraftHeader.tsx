type DraftHeaderProps = {
  round: number;
  pickNumber: number;
  teamName: string;
};

export default function DraftHeader({
  round,
  pickNumber,
  teamName,
}: DraftHeaderProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
            Round {round} • Pick {pickNumber}
          </p>

          <h1 className="mt-2 text-3xl font-black">
            {teamName} is on the clock
          </h1>
        </div>

        <div className="rounded-xl bg-zinc-800 px-5 py-3 text-center">
          <p className="text-xs uppercase text-zinc-500">
            Draft Timer
          </p>

          <p className="text-2xl font-black text-yellow-400">
            01:30
          </p>
        </div>
      </div>
    </div>
  );
}