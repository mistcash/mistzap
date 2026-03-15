"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/app/context/AppContext";

interface Props {
  onClose: () => void;
}

export default function QRScanModal({ onClose }: Props) {
  const { openPayment } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const scannerRunningRef = useRef(false);
  const stopInProgressRef = useRef(false);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [errorMsg, setErrorMsg] = useState("");
  const scannedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function safeStopScanner() {
      const s = scannerRef.current as {
        stop?: () => Promise<void>;
        clear?: () => void;
      } | null;

      if (!s || !scannerRunningRef.current || stopInProgressRef.current) {
        return;
      }

      stopInProgressRef.current = true;
      try {
        try {
          await s.stop?.();
        } catch {
          // html5-qrcode may reject/throw if already stopped; ignore during teardown.
        }
      } finally {
        scannerRunningRef.current = false;
        stopInProgressRef.current = false;
        s.clear?.();
      }
    }

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled || !containerRef.current) return;

        const scannerId = "mistzap-qr-reader";
        const el = document.getElementById(scannerId);
        if (!el) return;

        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText: string) => {
            if (scannedRef.current) return;
            scannedRef.current = true;

            safeStopScanner().finally(() => {
              openPayment(decodedText);
              onClose();
            });
          },
          () => {
            // ignore per-frame errors
          }
        );

        if (!cancelled) {
          scannerRunningRef.current = true;
          setStatus("scanning");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(
            err instanceof Error ? err.message : "Camera access denied"
          );
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      void safeStopScanner();
    };
  }, [openPayment, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-sm rounded-t-3xl border border-[#ff9d42]/25 bg-[#091329] p-6 shadow-2xl sm:rounded-3xl">
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#ffb66b]/40 sm:hidden" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Scan QR Code</h2>
            <p className="mt-0.5 text-xs text-[#d8b58d]">
              Point at a MISTzap QR code
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ff9d42]/25 bg-[#091329]/70 text-[#d8b58d] transition-colors hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Camera view */}
        <div ref={containerRef} className="relative overflow-hidden rounded-2xl bg-black">
          {/* html5-qrcode mounts into this element */}
          <div id="mistzap-qr-reader" className="w-full" />

          {/* Overlay when starting */}
          {status === "starting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
              <Spinner />
              <p className="text-sm text-[#d8b58d]">Starting camera...</p>
            </div>
          )}

          {/* Scan frame overlay */}
          {status === "scanning" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-60 w-60">
                {/* Corner markers */}
                <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-sm border-l-2 border-t-2 border-[#ff9d42]" />
                <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-sm border-r-2 border-t-2 border-[#ff9d42]" />
                <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-sm border-b-2 border-l-2 border-[#ff9d42]" />
                <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-sm border-b-2 border-r-2 border-[#ff9d42]" />
                {/* Scan line animation */}
                <span className="absolute left-0 right-0 h-0.5 animate-scan bg-[#ffb66b]/70" style={{ top: "50%" }} />
              </div>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="flex h-48 flex-col items-center justify-center gap-3 p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ef6105]/20">
                <ErrorIcon className="h-6 w-6 text-[#ff9d42]" />
              </div>
              <p className="text-sm font-medium text-white">Camera unavailable</p>
              <p className="text-xs text-[#d8b58d]">{errorMsg}</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-[#98775b]">
          Camera access is required to scan QR codes
        </p>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        /* Override html5-qrcode default styles */
        #mistzap-qr-reader video {
          width: 100% !important;
          border-radius: 0 !important;
          border: none !important;
        }
        #mistzap-qr-reader img {
          display: none !important;
        }
        #mistzap-qr-reader button {
          display: none !important;
        }
        #mistzap-qr-reader select {
          display: none !important;
        }
        #mistzap-qr-reader__scan_region {
          border: none !important;
          min-height: 0 !important;
        }
        #mistzap-qr-reader__dashboard {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
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
