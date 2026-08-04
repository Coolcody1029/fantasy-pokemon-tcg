"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthToken,
  getCurrentUser,
} from "@/lib/api";

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
};

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  function handleLogout() {
    clearAuthToken();

    setUser(null);

    router.push("/");

    router.refresh();
  }

  return (
    <nav className="border-b border-zinc-800 bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
        <Link
          href="/"
          className="text-xl font-black text-white"
        >
          FANTASY
          <span className="text-yellow-400">
            {" "}
            TCG
          </span>
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

          {user && (
            <Link
              className="transition hover:text-yellow-400"
              href="/my-leagues"
            >
              My Leagues
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!loadingUser && !user && (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 font-semibold text-white transition hover:text-yellow-400"
              >
                Log In
              </Link>

              <Link
                href="/register"
                className="rounded-lg border border-zinc-700 px-4 py-2 font-semibold text-white transition hover:border-yellow-400"
              >
                Register
              </Link>
            </>
          )}

          {!loadingUser && user && (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-white">
                  {user.username}
                </p>

                <p className="text-xs text-zinc-500">
                  Signed in
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-zinc-700 px-4 py-2 font-semibold text-white transition hover:border-red-500 hover:text-red-400"
              >
                Logout
              </button>
            </>
          )}

          <Link
            href="/create-league"
            className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-black transition hover:bg-yellow-300"
          >
            Create League
          </Link>
        </div>
      </div>
    </nav>
  );
}