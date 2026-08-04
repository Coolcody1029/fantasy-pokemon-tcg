import type { DraftPick } from "@/types/draft";

type DraftBoardProps = {
  picks: DraftPick[];
};

export default function DraftBoard({
  picks,
}: DraftBoardProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-6">
        <p className="text-sm font-semibold text-yellow-400">
          Live Draft
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          Draft Board
        </h2>
      </div>

      <div>
        {picks.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No picks yet.
          </div>
        ) : (
          picks
            .slice()
            .reverse()
            .map((pick) => (
              <div
                key={pick.pickNumber}
                className="border-b border-zinc-800 px-6 py-5 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-yellow-400">
                    Pick {pick.pickNumber}
                  </span>

                  <span className="text-xs text-zinc-500">
                    Round {pick.round}
                  </span>
                </div>

                <h3 className="mt-2 font-bold">
                  {pick.player.name}
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  {pick.team.name}
                </p>
              </div>
            ))
        )}
      </div>
    </section>
  );
}