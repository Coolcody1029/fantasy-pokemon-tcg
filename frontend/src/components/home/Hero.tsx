export default function Hero() {
  return (
    <section className="bg-black px-8 py-28">
      <div className="mx-auto max-w-5xl text-center">
        <div className="mb-6 inline-block rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-400">
          Fantasy Sports Meets Competitive Pokémon TCG
        </div>

        <h1 className="text-5xl font-black tracking-tight text-white md:text-7xl">
          Draft the best.
          <br />
          <span className="text-yellow-400">
            Dominate Regionals.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Draft competitive Pokémon TCG players, compete head-to-head
          with friends, and score fantasy points based on real Regional
          tournament results.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <button className="rounded-xl bg-yellow-400 px-8 py-4 font-bold text-black transition hover:bg-yellow-300">
            Create a League
          </button>

          <button className="rounded-xl border border-zinc-700 px-8 py-4 font-bold text-white transition hover:border-yellow-400">
            Join a League
          </button>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-10 text-sm">
          <div>
            <p className="text-2xl font-black text-white">10+</p>
            <p className="text-zinc-500">Regionals</p>
          </div>

          <div>
            <p className="text-2xl font-black text-white">500+</p>
            <p className="text-zinc-500">Players</p>
          </div>

          <div>
            <p className="text-2xl font-black text-white">Live</p>
            <p className="text-zinc-500">Fantasy Scoring</p>
          </div>
        </div>
      </div>
    </section>
  );
}