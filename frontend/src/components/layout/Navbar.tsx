import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-zinc-800 bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
        <Link href="/" className="text-xl font-black text-white">
          FANTASY
          <span className="text-yellow-400"> TCG</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-semibold text-zinc-300 md:flex">
          <Link
            className="transition hover:text-yellow-400"
            href="/"
          >
            Home
          </Link>

          <Link
            className="transition hover:text-yellow-400"
            href="/players"
          >
            Players
          </Link>

          <Link
            className="transition hover:text-yellow-400"
            href="/regionals"
          >
            Regionals
          </Link>

          <Link
            className="transition hover:text-yellow-400"
             href="/draft"
>
              Draft
        </Link>

           
            
          <Link
            className="transition hover:text-yellow-400"
            href="/dashboard"
          >
            My League
          </Link>
        </div>

        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 font-semibold text-white"
          >
            Log In
          </Link>

          <Link
            href="/create-league"
            className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-black"
          >
            Create League
          </Link>
        </div>
      </div>
    </nav>
  );
}