"use client";

import { useAccount, useDisconnect, useReadContract } from "@starknet-react/core";
import { useState, useEffect, useMemo } from "react";
import { HIDEMI_CONTRACT_ADDRESS, HIDEMI_ABI } from "@/lib/config";
import { generateSecretKey } from "@/lib/secret";
import QRCodeModal from "./QRCodeModal";
import ScanModal from "./ScanModal";

export default function Dashboard() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [showQR, setShowQR] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [secretKey, setSecretKey] = useState<string>("");

  useEffect(() => {
    if (address) {
      setSecretKey(generateSecretKey(address));
    }
  }, [address]);

  const { data: balanceData } = useReadContract({
    address: HIDEMI_CONTRACT_ADDRESS,
    abi: HIDEMI_ABI,
    functionName: "get_balance",
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  const balance = useMemo(() => {
    if (!balanceData) return "0";
    const val = BigInt(balanceData.toString());
    const whole = val / BigInt(10 ** 18);
    const frac = val % BigInt(10 ** 18);
    const fracStr = frac.toString().padStart(18, "0").slice(0, 4);
    return `${whole}.${fracStr}`;
  }, [balanceData]);

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <div className="text-lg font-bold">
          <span className="text-yellow-400">Stark</span>Zap
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">{shortAddr}</span>
          <button
            onClick={() => disconnect()}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Disconnect
          </button>
        </div>
      </header>

      {/* Balance */}
      <div className="flex flex-col items-center py-10 gap-1">
        <p className="text-gray-400 text-sm">Your Balance</p>
        <p className="text-4xl font-bold">{balance} <span className="text-lg text-gray-400">ETH</span></p>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-6 pb-8">
        <button
          onClick={() => setShowQR(true)}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-14 h-14 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="text-xs text-gray-300">Show QR</span>
        </button>

        <button
          onClick={() => setShowScan(true)}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-14 h-14 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4m8-18h4a2 2 0 012 2v4m0 6v4a2 2 0 01-2 2h-4" />
            </svg>
          </div>
          <span className="text-xs text-gray-300">Scan QR</span>
        </button>
      </div>

      {/* Activity */}
      <div className="flex-1 px-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Recent Activity</h2>
        <div className="flex flex-col items-center justify-center py-12 text-gray-600 text-sm">
          No activity yet
        </div>
      </div>

      {/* Modals */}
      {showQR && (
        <QRCodeModal secretKey={secretKey} onClose={() => setShowQR(false)} />
      )}
      {showScan && (
        <ScanModal onClose={() => setShowScan(false)} />
      )}
    </div>
  );
}
