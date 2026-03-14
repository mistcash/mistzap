"use client";

import { useState } from "react";
import { useApp } from "@/app/context/AppContext";
import { isValidStarknetAddress } from "@/lib/crypto";

export default function LoginScreen() {
  const { login, isLoadingKey } = useApp();
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    const trimmed = address.trim();
    if (!isValidStarknetAddress(trimmed)) {
      setError("Enter a valid Starknet address (0x…)");
      return;
    }
    setError("");
    setConnecting(true);
    try {
      await login(trimmed);
    } finally {
      setConnecting(false);
    }
  }

  function handleDemo() {
    // Demo wallet for testing
    setAddress("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7");
  }

  const busy = connecting || isLoadingKey;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#12003a] px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/20 blur-3xl" />
        <div className="absolute left-1/4 bottom-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-500/30">
            <svg
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 4L38 13V31L22 40L6 31V13L22 4Z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M14 20L20 26L30 16"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              StarkZap
            </h1>
            <p className="mt-1 text-sm text-violet-300/70">
              Private payments on Starknet
            </p>
          </div>
        </div>

        {/* Welcome card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-1 text-lg font-semibold text-white">
            Welcome back
          </h2>
          <p className="mb-5 text-sm text-zinc-400">
            Connect your Starknet wallet to continue.
          </p>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Wallet address
            </label>
            <input
              type="text"
              placeholder="0x…"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>

          <button
            onClick={handleConnect}
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Connecting…
              </span>
            ) : (
              "Connect Wallet"
            )}
          </button>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={handleDemo}
            disabled={busy}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
          >
            Use Demo Wallet
          </button>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-600">
          Powered by Starknet &middot; Privacy by design
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
