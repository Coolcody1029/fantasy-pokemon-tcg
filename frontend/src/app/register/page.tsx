"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { setAuthToken, apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

   try {
  const registerResponse = await apiFetch(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    }
  );

      if (!registerResponse.ok) {
        const message = await registerResponse.text();

        throw new Error(
          message || "Registration failed."
        );
      }

      // Automatically log in immediately after registration.
     const loginResponse = await apiFetch(
  "/api/auth/login",
  {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  }
);

      if (!loginResponse.ok) {
        throw new Error(
          "Account created, but automatic login failed."
        );
      }

      const data = await loginResponse.json();

      setAuthToken(data.token);

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
          Account
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Create Account
        </h1>

        <p className="mt-3 text-zinc-400">
          Create an account to join fantasy Pokémon TCG leagues.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Username
            </label>

            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Email
            </label>

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              type="email"
              required
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Password
            </label>

            <input
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              type="password"
              minLength={8}
              required
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
            />

            <p className="mt-2 text-xs text-zinc-500">
              Minimum 8 characters.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-yellow-400 py-3 font-black text-black transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>
      </div>
    </main>
  );
}