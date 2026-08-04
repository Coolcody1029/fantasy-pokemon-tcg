import PlayerCard from "./PlayerCard";

const players = [
  {
    name: "Tord Reklev",
    country: "Norway",
    championshipPoints: 850,
    fantasyPoints: 412,
    rank: 1,
  },
  {
    name: "Azul Garcia Griego",
    country: "United States",
    championshipPoints: 790,
    fantasyPoints: 389,
    rank: 2,
  },
  {
    name: "Isaiah Bradner",
    country: "United States",
    championshipPoints: 735,
    fantasyPoints: 361,
    rank: 3,
  },
  {
    name: "Rahul Reddy",
    country: "United States",
    championshipPoints: 701,
    fantasyPoints: 344,
    rank: 4,
  },
];

export default function FeaturedPlayers() {
  return (
    <section className="bg-black px-8 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="font-semibold text-yellow-400">
            Player Rankings
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            Top Fantasy Players
          </h2>

          <p className="mt-3 text-zinc-400">
            Track the competitive players producing the most fantasy value.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {players.map((player) => (
            <PlayerCard
              key={player.name}
              {...player}
            />
          ))}
        </div>
      </div>
    </section>
  );
}