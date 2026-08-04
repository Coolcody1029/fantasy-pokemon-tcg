import type { DraftPick, FantasyTeam } from "@/types/draft";

type DraftRostersProps = {
  teams: FantasyTeam[];
  picks: DraftPick[];
};

export default function DraftRosters({
  teams,
  picks,
}: DraftRostersProps) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-6">
        <p className="text-sm font-semibold text-yellow-400">
          Team Rosters
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          Drafted Players
        </h2>
      </div>

      <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4">
        {teams.map((team) => {
          const teamPicks = picks.filter(
            (pick) => pick.team.id === team.id
          );

          return (
            <div
              key={team.id}
              className="border-b border-zinc-800 p-6 md:border-r xl:border-b-0"
            >
              <h3 className="font-bold text-white">
                {team.name}
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                {teamPicks.length} players drafted
              </p>

              <div className="mt-5 space-y-3">
                {teamPicks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-600">
                    No players yet
                  </div>
                ) : (
                  teamPicks.map((pick) => (
                    <div
                      key={pick.pickNumber}
                      className="rounded-xl bg-zinc-800 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-yellow-400">
                          #{pick.player.rank}
                        </span>

                        <span className="text-xs text-zinc-500">
                          Pick {pick.pickNumber}
                        </span>
                      </div>

                      <p className="mt-2 font-bold">
                        {pick.player.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {pick.player.country}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}