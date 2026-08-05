"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { setAuthToken, apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

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
  const response = await apiFetch(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || "Login failed."
        );
      }

      const data = await response.json();

      setAuthToken(data.token);

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed."
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
          Login
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8"
        >
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
              required
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-yellow-400"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-yellow-400 py-3 font-black text-black disabled:opacity-50"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}