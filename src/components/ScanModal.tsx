"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import PaymentScreen from "./PaymentScreen";

interface Props {
  onClose: () => void;
}

export default function ScanModal({ onClose }: Props) {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (mounted) {
              setScannedCode(decodedText);
              scanner.stop().catch(() => {});
            }
          },
          () => {}
        );
      } catch (err) {
        if (mounted) {
          setError("Camera access denied or not available. You can enter a code manually.");
        }
      }
    };

    if (!scannedCode) {
      startScanner();
    }

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [scannedCode]);

  if (scannedCode) {
    return <PaymentScreen txSecret={scannedCode} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Scan QR Code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        <div
          id="qr-reader"
          ref={containerRef}
          className="w-full rounded-xl overflow-hidden mb-4"
        />

        {error && (
          <div className="flex flex-col gap-3">
            <p className="text-yellow-400 text-sm text-center">{error}</p>
            <input
              type="text"
              placeholder="Paste hex code (0x...)"
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-yellow-400/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) setScannedCode(val);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
