"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

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
  const pathname = usePathname();

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [
    loadingUser,
    setLoadingUser,
  ] = useState(true);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearAuthToken();

    setUser(null);
    setMobileOpen(false);

    router.push("/");
    router.refresh();
  }

  function isActive(
    href: string
  ) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(
      href
    );
  }

  function navLinkClass(
    href: string
  ) {
    return `transition ${
      isActive(href)
        ? "text-yellow-400"
        : "text-zinc-300 hover:text-yellow-400"
    }`;
  }

  /*
   * Logged-out users must authenticate
   * before creating a league.
   */
  const createLeagueHref =
    loadingUser
      ? "/login"
      : user
        ? "/create-league"
        : "/login";

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-18 items-center justify-between py-4">

          {/* LOGO */}
          <Link
            href="/"
            className="shrink-0 text-xl font-black tracking-tight text-white"
          >
            FANTASY{" "}
            <span className="text-yellow-400">
              TCG
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <Link
              href="/"
              className={
                navLinkClass("/")
              }
            >
              Home
            </Link>

            <Link
              href="/players"
              className={
                navLinkClass(
                  "/players"
                )
              }
            >
              Players
            </Link>

            <Link
              href="/regionals"
              className={
                navLinkClass(
                  "/regionals"
                )
              }
            >
              Regionals
            </Link>

            {user && (
              <Link
                href="/my-leagues"
                className={
                  navLinkClass(
                    "/my-leagues"
                  )
                }
              >
                My Leagues
              </Link>
            )}
          </div>

          {/* DESKTOP ACCOUNT ACTIONS */}
          <div className="hidden items-center gap-3 md:flex">
            {!loadingUser &&
              !user && (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:text-yellow-400"
                  >
                    Log In
                  </Link>

                  <Link
                    href="/register"
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-yellow-400"
                  >
                    Register
                  </Link>
                </>
              )}

            {!loadingUser &&
              user && (
                <>
                  <div className="hidden text-right lg:block">
                    <p className="text-sm font-bold text-white">
                      {
                        user.username
                      }
                    </p>

                    <p className="text-xs text-zinc-500">
                      Signed in
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-red-500 hover:text-red-400"
                  >
                    Logout
                  </button>
                </>
              )}

            <Link
              href={
                createLeagueHref
              }
              className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              Create League
            </Link>
          </div>

          {/* MOBILE BUTTON */}
          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() =>
              setMobileOpen(
                (previous) =>
                  !previous
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 text-white transition hover:border-yellow-400 md:hidden"
          >
            <span className="text-xl">
              {mobileOpen
                ? "×"
                : "☰"}
            </span>
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="border-t border-zinc-900 pb-5 pt-4 md:hidden">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                className={`rounded-lg px-3 py-3 font-semibold ${
                  isActive("/")
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                Home
              </Link>

              <Link
                href="/players"
                className={`rounded-lg px-3 py-3 font-semibold ${
                  isActive(
                    "/players"
                  )
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                Players
              </Link>

              <Link
                href="/regionals"
                className={`rounded-lg px-3 py-3 font-semibold ${
                  isActive(
                    "/regionals"
                  )
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                Regionals
              </Link>

              {user && (
                <Link
                  href="/my-leagues"
                  className={`rounded-lg px-3 py-3 font-semibold ${
                    isActive(
                      "/my-leagues"
                    )
                      ? "bg-yellow-400/10 text-yellow-400"
                      : "text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  My Leagues
                </Link>
              )}
            </div>

            <div className="mt-4 border-t border-zinc-900 pt-4">
              {!loadingUser &&
                user && (
                  <div className="mb-4 rounded-xl bg-zinc-900 p-4">
                    <p className="font-bold">
                      {
                        user.username
                      }
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {
                        user.email
                      }
                    </p>
                  </div>
                )}

              <div className="grid gap-3">
                <Link
                  href={
                    createLeagueHref
                  }
                  className="rounded-xl bg-yellow-400 px-4 py-3 text-center font-black text-black transition hover:bg-yellow-300"
                >
                  Create League
                </Link>

                {!loadingUser &&
                  !user && (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/login"
                        className="rounded-xl border border-zinc-700 px-4 py-3 text-center font-bold text-white"
                      >
                        Log In
                      </Link>

                      <Link
                        href="/register"
                        className="rounded-xl border border-zinc-700 px-4 py-3 text-center font-bold text-white"
                      >
                        Register
                      </Link>
                    </div>
                  )}

                {!loadingUser &&
                  user && (
                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      className="rounded-xl border border-zinc-700 px-4 py-3 font-bold text-white transition hover:border-red-500 hover:text-red-400"
                    >
                      Logout
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}