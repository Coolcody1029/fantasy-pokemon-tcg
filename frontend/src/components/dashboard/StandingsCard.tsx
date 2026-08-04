const standings = [
  { rank: 1, team: "Cody", record: "3-0" },
  { rank: 2, team: "Team Rocket", record: "2-1" },
  { rank: 3, team: "Rare Candy", record: "2-1" },
  { rank: 4, team: "Lost Zone", record: "1-2" },
];

export default function StandingsCard() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-6">
        <p className="text-sm font-semibold text-yellow-400">
          League
        </p>

        <h2 className="mt-1 text-xl font-bold">
          Standings
        </h2>
      </div>

      <div>
        {standings.map((team) => (
          <div
            key={team.team}
            className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-4">
              <span className="w-5 font-bold text-zinc-500">
                {team.rank}
              </span>

              <span className="font-semibold">
                {team.team}
              </span>
            </div>

            <span className="text-sm font-bold">
              {team.record}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}