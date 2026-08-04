import Navbar from "@/components/layout/Navbar";
import DraftRoom from "@/components/draft/DraftRoom";

export default function DraftPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <DraftRoom />
    </main>
  );
}