"use client";

import { useState } from "react";
import { useApp } from "@/app/context/AppContext";
import { truncateAddress } from "@/lib/crypto";
import { TOKEN_LIST, TOKEN_ICONS } from "@/lib/tokens";
import QRGenerateModal from "./QRGenerateModal";
import QRScanModal from "./QRScanModal";
import FooterCredits from "./FooterCredits";
import Image from "next/image";

const WALLET_LABELS: Record<string, string> = {
  cartridge: "Cartridge",
  argent: "Argent X",
  braavos: "Braavos",
};

export default function HomeScreen() {
  const { walletAddress, walletType, tokenBalances, activity, logout } = useApp();
  const [showQR, setShowQR] = useState(false);
  const [showScan, setShowScan] = useState(false);

  const walletLabel = walletType ? WALLET_LABELS[walletType] ?? walletType : "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-linear-to-br from-[#040915] via-[#091329] to-[#0f1f3a]">
      {/* Header */}
      <header className="flex w-full max-w-sm items-center justify-between px-5 pt-10 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-[#ef6105] to-[#ff9d42] shadow-[0_0_22px_rgba(255,126,27,0.45)]">
            <Image src="/mistzap.png" alt="MISTzap Logo" width={80} height={80} />
          </div>
          <span className="font-bold text-white text-lg">MISTzap</span>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-[#ff9d42]/25 bg-[#091329]/70 px-3 py-1.5 text-xs text-[#d8b58d] transition-all hover:bg-[#11213d] hover:text-[#fff1df]"
        >
          Disconnect
        </button>
      </header>

      <main className="w-full max-w-sm flex-1 space-y-5 px-5 pt-6 pb-10">
        {/* Wallet chip */}
        <div className="flex items-center gap-2">
          <div className="flex w-fit items-center gap-2 rounded-full border border-[#ff9d42]/25 bg-[#091329]/70 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-[#ff9d42] animate-pulse" />
            <span className="font-mono text-xs text-[#ffd7ae]">
              {walletAddress ? truncateAddress(walletAddress, 8) : "—"}
            </span>
          </div>
          {walletLabel && (
            <span className="rounded-full border border-[#ff9d42]/20 bg-[#ff9d42]/10 px-3 py-1.5 text-xs font-medium text-[#ffb66b]">
              {walletLabel}
            </span>
          )}
        </div>

        {/* Token balances grid */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#98775b]">
            Your Balances
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TOKEN_LIST.map((token) => {
              const balance = tokenBalances[token.key] ?? "—";
              return (
                <div
                  key={token.key}
                  className="rounded-2xl border border-[#ff9d42]/20 bg-[#091329]/70 p-4"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg leading-none">{TOKEN_ICONS[token.key]}</span>
                    <span className="text-xs font-semibold text-[#d8b58d]">{token.symbol}</span>
                  </div>
                  <p className="font-mono text-sm font-semibold text-white truncate">
                    {balance}
                  </p>
                  <p className="text-xs text-[#98775b] mt-0.5">{token.name}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowQR(true)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#ff9d42]/25 bg-[#091329]/70 p-5 transition-all hover:bg-[#11213d] active:scale-[0.97]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff7e1b]/20">
              <QRIcon className="h-6 w-6 text-[#ffb66b]" />
            </div>
            <span className="text-sm font-medium text-white">My QR Code</span>
            <span className="text-xs text-[#98775b]">Show to receive</span>
          </button>

          <button
            onClick={() => setShowScan(true)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#ff9d42]/25 bg-[#091329]/70 p-5 transition-all hover:bg-[#11213d] active:scale-[0.97]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff9d42]/20">
              <ScanIcon className="h-6 w-6 text-[#ffb66b]" />
            </div>
            <span className="text-sm font-medium text-white">Scan QR</span>
            <span className="text-xs text-[#98775b]">Send payment</span>
          </button>
        </div>

        {/* Activity */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#98775b]">
            Recent Activity
          </h3>
          {activity.length === 0 ? (
            <div className="rounded-2xl border border-[#ff9d42]/25 bg-[#091329]/70 p-8 text-center text-sm text-[#98775b]">
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
    <div className="flex items-center gap-3 rounded-xl border border-[#ff9d42]/20 bg-[#091329]/70 px-4 py-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${sent ? "bg-[#ef6105]/25" : "bg-[#ffb66b]/22"
          }`}
      >
        {sent ? (
          <ArrowUpIcon className="h-4 w-4 text-[#ff7e1b]" />
        ) : (
          <ArrowDownIcon className="h-4 w-4 text-[#ffb66b]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">
          {sent ? "Sent" : "Received"}
        </p>
        <p className="truncate font-mono text-xs text-[#98775b]">
          {item.address}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold ${sent ? "text-[#ff7e1b]" : "text-[#ffb66b]"
            }`}
        >
          {sent ? "-" : "+"}
          {item.amount}
        </p>
        <p className="text-xs text-[#98775b]">{date}</p>
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
