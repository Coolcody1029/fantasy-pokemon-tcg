const roster = [
  {
    name: "Tord Reklev",
    status: "Active",
    fantasyPoints: 48.5,
  },
  {
    name: "Azul Garcia Griego",
    status: "Active",
    fantasyPoints: 39.0,
  },
  {
    name: "Isaiah Bradner",
    status: "Active",
    fantasyPoints: 31.0,
  },
  {
    name: "Rahul Reddy",
    status: "Bench",
    fantasyPoints: 24.0,
  },
];

export default function RosterCard() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-6">
        <p className="text-sm font-semibold text-yellow-400">
          Fantasy Team
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          My Roster
        </h2>
      </div>

      <div>
        {roster.map((player) => (
          <div
            key={player.name}
            className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 last:border-b-0"
          >
            <div>
              <h3 className="font-bold">
                {player.name}
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                {player.status}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xl font-black">
                {player.fantasyPoints}
              </p>

              <p className="text-xs text-zinc-500">
                Fantasy Points
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}