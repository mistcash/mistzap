"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/app/context/AppContext";
import { generateQRPayloadForIndex, incrementQRIndex } from "@/lib/crypto";

// QRCodeSVG is safe to import server-side; QRCodeCanvas needs client only
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  { ssr: false }
);

interface Props {
  onClose: () => void;
}

export default function QRGenerateModal({ onClose }: Props) {
  const { walletAddress, qrIndex, refreshQRIndex } = useApp();
  const [payload, setPayload] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(qrIndex);
  const generated = useRef(false);

  // Generate QR payload once on mount; increment index each time modal opens
  useEffect(() => {
    if (generated.current || !walletAddress) return;
    generated.current = true;

    const newIndex = incrementQRIndex();
    refreshQRIndex();
    setCurrentIndex(newIndex);

    // The crypto helper derives the wallet secret internally and only returns the one-time payload.
    generateQRPayloadForIndex(walletAddress, newIndex).then(setPayload);
  }, [walletAddress, refreshQRIndex]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-sm rounded-t-3xl border border-[#ff9d42]/25 bg-[#0b101e] p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#ffb66b]/40 sm:hidden" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Your QR Code</h2>
            <p className="mt-0.5 text-xs text-[#d8b58d]">
              Share to receive a payment
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ff9d42]/25 bg-[#091329]/70 text-[#d8b58d] transition-colors hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-lg">
            {payload ? (
              <QRCodeSVG
                value={payload}
                size={200}
                level="M"
                includeMargin={false}
                fgColor="#091329"
              />
            ) : (
              <div className="flex h-50 w-50 items-center justify-center">
                <Spinner />
              </div>
            )}
          </div>

          {/* Payload preview */}
          <div className="w-full rounded-xl border border-[#ff9d42]/25 bg-[#091329]/70 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#98775b]">
              Payload (index #{currentIndex})
            </p>
            <p className="break-all font-mono text-xs text-[#ffb66b]">
              {payload || "Generating…"}
            </p>
          </div>

          <p className="text-center text-xs text-[#98775b]">
            Each scan generates a unique one-time code
          </p>
        </div>
      </div>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-8 w-8 animate-spin text-[#ff9d42]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
