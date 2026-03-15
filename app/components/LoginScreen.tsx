"use client";

import { useApp } from "@/app/context/AppContext";
import FooterCredits from "./FooterCredits";

export default function LoginScreen() {
  const { connectCartridge, isConnecting, connectError } = useApp();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#12003a] px-6">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/20 blur-3xl" />
        <div className="absolute left-1/4 bottom-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-500/30">
            <ZapLogo />
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

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-1 text-lg font-semibold text-white">
            Welcome
          </h2>
          <p className="mb-6 text-sm text-zinc-400">
            Sign in with your Cartridge wallet to send and receive private
            payments.
          </p>

          {/* Cartridge connect button */}
          <button
            onClick={connectCartridge}
            disabled={isConnecting}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isConnecting ? (
              <>
                <Spinner />
                Connecting…
              </>
            ) : (
              <>
                <CartridgeIcon />
                Connect with Cartridge
              </>
            )}
          </button>

          {/* Error */}
          {connectError && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-xs text-red-400">{connectError}</p>
            </div>
          )}
        </div>

        {/* Feature bullets */}
        <div className="mt-6 space-y-2">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-1 w-1 rounded-full bg-violet-500/60" />
              {f}
            </div>
          ))}
        </div>

        <FooterCredits className="mt-8" />
      </div>
    </div>
  );
}

const FEATURES = [
  "Social login via Cartridge — no seed phrases",
  "One-time QR codes for every payment",
  "Sponsored transactions via AVNU paymaster",
];

// --- Icons ---

function ZapLogo() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
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
  );
}

function CartridgeIcon() {
  // Simple gamepad-like icon representing Cartridge
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="M6 12h4M8 10v4" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
