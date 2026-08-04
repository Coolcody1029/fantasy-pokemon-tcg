import Navbar from "@/components/layout/Navbar";

export default function PlayersPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-8 py-12">
        <h1 className="text-4xl font-black">
          Players
        </h1>

        <p className="mt-3 text-zinc-400">
          Competitive Pokémon TCG players will appear here.
        </p>
      </div>
    </main>
  );
}