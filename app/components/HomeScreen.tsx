"use client";

import { useState } from "react";
import { useApp } from "@/app/context/AppContext";
import { truncateAddress } from "@/lib/crypto";
import QRGenerateModal from "./QRGenerateModal";
import QRScanModal from "./QRScanModal";
import FooterCredits from "./FooterCredits";

export default function HomeScreen() {
  const { walletAddress, balance, activity, logout } = useApp();
  const [showQR, setShowQR] = useState(false);
  const [showScan, setShowScan] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#12003a]">
      {/* Header */}
      <header className="flex w-full max-w-sm items-center justify-between px-5 pt-10 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 shadow shadow-violet-500/30">
            <svg width="18" height="18" viewBox="0 0 44 44" fill="none">
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
          <span className="font-bold text-white text-lg">StarkZap</span>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
        >
          Disconnect
        </button>
      </header>

      <main className="w-full max-w-sm flex-1 space-y-5 px-5 pt-6 pb-10">
        {/* Wallet chip */}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 w-fit">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs text-zinc-300">
            {walletAddress ? truncateAddress(walletAddress, 8) : "—"}
          </span>
        </div>

        {/* Balance card */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-600/80 to-purple-800/80 p-6 shadow-xl shadow-violet-500/20">
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent" />
          <div className="relative">
            <p className="text-sm font-medium text-violet-200/70">
              Total Balance
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-white" data-amt={balance}>
              {balance.replace(/[^\d.]/g, '')}
              <span className="text-lg font-medium text-white/70"> USDC</span>
            </p>
          </div>
          {/* Decorative circle */}
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-white/10" />
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full border border-white/10" />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowQR(true)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10 active:scale-[0.97]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
              <QRIcon className="h-6 w-6 text-violet-400" />
            </div>
            <span className="text-sm font-medium text-white">My QR Code</span>
            <span className="text-xs text-zinc-500">Show to receive</span>
          </button>

          <button
            onClick={() => setShowScan(true)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10 active:scale-[0.97]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
              <ScanIcon className="h-6 w-6 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-white">Scan QR</span>
            <span className="text-xs text-zinc-500">Send payment</span>
          </button>
        </div>

        {/* Activity */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Recent Activity
          </h3>
          {activity.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-600">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-2">
              {activity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
        <FooterCredits />
      </main>

      {showQR && <QRGenerateModal onClose={() => setShowQR(false)} />}
      {showScan && <QRScanModal onClose={() => setShowScan(false)} />}
    </div>
  );
}

function ActivityRow({
  item,
}: {
  item: {
    id: string;
    type: "sent" | "received";
    amount: string;
    address: string;
    timestamp: number;
  };
}) {
  const sent = item.type === "sent";
  const date = new Date(item.timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${sent ? "bg-red-500/15" : "bg-emerald-500/15"
          }`}
      >
        {sent ? (
          <ArrowUpIcon className="h-4 w-4 text-red-400" />
        ) : (
          <ArrowDownIcon className="h-4 w-4 text-emerald-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">
          {sent ? "Sent" : "Received"}
        </p>
        <p className="truncate font-mono text-xs text-zinc-500">
          {item.address}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold ${sent ? "text-red-400" : "text-emerald-400"
            }`}
        >
          {sent ? "-" : "+"}
          {item.amount}
        </p>
        <p className="text-xs text-zinc-600">{date}</p>
      </div>
    </div>
  );
}

// --- Icons ---

function QRIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3zM18 18v-2" />
    </svg>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}
