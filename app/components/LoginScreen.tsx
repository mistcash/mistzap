"use client";

import { useApp } from "@/app/context/AppContext";
import FooterCredits from "./FooterCredits";
import Image from "next/image";

export default function LoginScreen() {
  const { connectCartridge, connectArgent, connectBraavos, isConnecting, connectError } = useApp();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-[#040915] via-[#091329] to-[#0f1f3a] px-6">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7e1b]/18 blur-3xl" />
        <div className="absolute left-1/4 bottom-1/4 h-64 w-64 rounded-full bg-[#ffb66b]/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-[0_0_38px_rgba(255,126,27,0.45)]">
            <Image src="/mistzap.png" alt="MISTzap Logo" width={80} height={80} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              MISTzap
            </h1>
            <p className="mt-1 text-sm text-[#ffd7ae]/75">
              Private payments on Starknet
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#ff9d42]/25 bg-[#091329]/70 p-6 backdrop-blur-sm space-y-3">
          <div className="mb-4">
            <h2 className="mb-1 text-lg font-semibold text-white">
              Connect Wallet
            </h2>
            <p className="text-sm text-[#d8b58d]">
              Choose your Starknet wallet to send and receive private payments.
            </p>
          </div>

          {/* Cartridge connect button */}
          <button
            onClick={connectCartridge}
            disabled={isConnecting}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-[#ef6105] to-[#ff9d42] py-3.5 text-sm font-semibold text-[#220f00] shadow-[0_0_30px_rgba(255,126,27,0.35)] transition-all hover:from-[#ff7e1b] hover:to-[#ffb66b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConnecting ? (
              <>
                <Spinner />
                Connecting…
              </>
            ) : (
              <>
                <CartridgeIcon />
                Cartridge
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-[#ff9d42]/15" />
            <span className="text-xs text-[#98775b]">or browser wallet</span>
            <div className="flex-1 h-px bg-[#ff9d42]/15" />
          </div>

          {/* Argent X button */}
          <button
            onClick={connectArgent}
            disabled={isConnecting}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#ff9d42]/25 bg-[#091329]/80 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#11213d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConnecting ? <Spinner /> : <ArgentIcon />}
            Argent X
          </button>

          {/* Braavos button */}
          <button
            onClick={connectBraavos}
            disabled={isConnecting}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#ff9d42]/25 bg-[#091329]/80 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#11213d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConnecting ? <Spinner /> : <BraavosIcon />}
            Braavos
          </button>

          {/* Error */}
          {connectError && (
            <div className="mt-1 rounded-xl border border-[#ef6105]/35 bg-[#ef6105]/10 px-4 py-3">
              <p className="text-xs text-[#ffb66b]">{connectError}</p>
            </div>
          )}
        </div>

        {/* Feature bullets */}
        <div className="mt-6 space-y-2">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs text-[#98775b]">
              <span className="h-1 w-1 rounded-full bg-[#ff9d42]/70" />
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
  "Cartridge: social login, no seed phrases needed",
  "Argent X & Braavos: connect your browser wallet",
  "One-time QR codes for every payment",
  "Send USDC, ETH, WBTC or STRK privately",
];

function CartridgeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 196.3 173" className="block relative w-6 h-6 -my-1">
      <path fill="#000" d="M68.5,71.8h63.6v-16.4h-63.6c0,1.6,0,16.6,0,16.4Z"></path>
      <path fill="#000" d="M175.9,38.7l-38.9-16.4c-2.6-1.2-5.4-1.9-8.2-2h-57.1c-2.8,0-5.6.8-8.2,2l-38.9,16.4c-3.8,2-6.2,5.9-6.1,10.2v65.6c0,2.1,0,4.1,2.1,6.1l12.3,12.3c2,2.1,3.6,2.1,6.1,2.1h28.2c0,1.8,0,16.5,0,16.4h66.6v-16.4h-66.5v-16.4h-30.2c-1.1,0-2-.9-2-2,0,0,0,0,0,0V38.7c0-1.1.9-2,2-2h126.7c1.1,0,2,.8,2,1.9,0,0,0,0,0,0v77.8c0,1.1-.8,2-1.9,2.1,0,0,0,0-.1,0h-29.9v16.4h27.9c2.6,0,4.1,0,6.1-2.1l12.3-12.3c2-2,2-4.1,2-6.1V48.9c0-4.3-2.3-8.3-6.1-10.2Z"></path>
    </svg>
  );
}

function ArgentIcon() {
  // Argent's shield-like logo mark
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#FF875B" />
      <path d="M16 6L8 10v7c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5v-7L16 6z" fill="white" />
      <path d="M13 16l2 2 4-4" stroke="#FF875B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BraavosIcon() {
  // Braavos geometric logo mark
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#F4C74F" />
      <path d="M16 6l8 5v10l-8 5-8-5V11l8-5z" fill="#1A1A2E" />
      <path d="M16 10l5 3v6l-5 3-5-3v-6l5-3z" fill="#F4C74F" />
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
