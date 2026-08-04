const events = [
  {
    name: "Baltimore Regional",
    location: "Baltimore, MD",
    date: "September 12",
    week: 1,
  },
  {
    name: "Louisville Regional",
    location: "Louisville, KY",
    date: "October 3",
    week: 2,
  },
  {
    name: "Toronto Regional",
    location: "Toronto, Canada",
    date: "October 24",
    week: 3,
  },
];

export default function UpcomingEvents() {
  return (
    <section className="bg-zinc-950 px-8 py-20">
      <div className="mx-auto max-w-7xl">
        <p className="font-semibold text-yellow-400">
          Fantasy Schedule
        </p>

        <h2 className="mt-2 text-3xl font-bold text-white">
          Upcoming Regionals
        </h2>

        <p className="mt-3 text-zinc-400">
          Every Regional acts like a fantasy football game week.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.name}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold text-black">
                  Week {event.week}
                </span>

                <span className="text-sm text-zinc-400">
                  {event.date}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white">
                {event.name}
              </h3>

              <p className="mt-2 text-zinc-400">
                {event.location}
              </p>

              <button className="mt-6 w-full rounded-xl border border-zinc-700 py-2.5 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400">
                View Matchup
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}