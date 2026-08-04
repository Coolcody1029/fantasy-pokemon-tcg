import Navbar from "@/components/layout/Navbar";
import LeagueHeader from "@/components/dashboard/LeagueHeader";
import MatchupCard from "@/components/dashboard/MatchupCard";
import RosterCard from "@/components/dashboard/RosterCard";
import StandingsCard from "@/components/dashboard/StandingsCard";
import CurrentRegional from "@/components/dashboard/CurrentRegional";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <LeagueHeader />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <MatchupCard />
            <RosterCard />
          </div>

          <div className="space-y-6">
            <CurrentRegional />
            <StandingsCard />
          </div>
        </div>
      </div>
    </main>
  );
}