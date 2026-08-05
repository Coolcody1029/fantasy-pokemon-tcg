import { Suspense } from "react";

import Navbar from "@/components/layout/Navbar";
import DraftRoom from "@/components/draft/DraftRoom";

export default function DraftPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-6 py-12 text-zinc-400">
            Loading draft...
          </div>
        }
      >
        <DraftRoom />
      </Suspense>
    </main>
  );
}