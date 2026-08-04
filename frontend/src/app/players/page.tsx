import Navbar from "@/components/layout/Navbar";
import PlayersBrowser from "@/components/players/PlayersBrowser";

export default function PlayersPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
          Fantasy Player Pool
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Competitive Players
        </h1>

        <p className="mt-3 max-w-2xl text-zinc-400">
          Research players before your draft using fantasy rankings,
          Championship Points, recent performance, and event history.
        </p>

        <div className="mt-8">
          <PlayersBrowser />
        </div>
      </div>
    </main>
  );
}