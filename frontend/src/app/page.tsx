import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import FeaturedPlayers from "@/components/home/FeaturedPlayers";
import UpcomingEvents from "@/components/home/UpcomingEvents";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <FeaturedPlayers />
      <UpcomingEvents />
    </main>
  );
}