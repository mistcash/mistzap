"use client";

import { useState } from "react";
import { CallData, uint256 } from "starknet";
import { useApp } from "@/app/context/AppContext";
import { HIDEMI_CONTRACT_ADDRESS, USDC_ADDRESS } from "@/lib/config";
import { truncateAddress } from "@/lib/crypto";
import FooterCredits from "./FooterCredits";

type TxStatus = "idle" | "preflight" | "executing" | "success" | "error";

// USDC has 6 decimal places
const USDC_DECIMALS = 6;

function parseUSDCAmount(input: string): bigint | null {
  const trimmed = input.trim();
  if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) return null;
  const parts = trimmed.split(".");
  const whole = BigInt(parts[0] || "0");
  let frac = BigInt(0);
  if (parts[1] !== undefined) {
    const fracStr = parts[1].slice(0, USDC_DECIMALS).padEnd(USDC_DECIMALS, "0");
    frac = BigInt(fracStr);
  }
  return whole * BigInt(10 ** USDC_DECIMALS) + frac;
}

export default function PaymentScreen() {
  const { scannedPayload, walletAddress, closePayment, getWallet } = useApp();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");

  const commitment = scannedPayload ?? "";

  async function handleDeposit() {
    const wallet = getWallet();
    if (!wallet || !commitment) return;

    const amountBase = parseUSDCAmount(usdcAmount);
    if (amountBase === null) {
      setErrorMsg("Enter a valid USDC amount greater than 0.");
      setTxStatus("error");
      return;
    }

    setTxStatus("preflight");
    setErrorMsg("");

    const amountU256 = uint256.bnToUint256(amountBase);
    const hashU256 = uint256.bnToUint256(BigInt(commitment));

    const calls = [
      // Step 1: approve Hidemi to spend USDC
      {
        contractAddress: USDC_ADDRESS,
        entrypoint: "approve",
        calldata: CallData.compile({
          spender: HIDEMI_CONTRACT_ADDRESS,
          amount: amountU256,
        }),
      },
      // Step 2: deposit — locks funds behind the scanned secret commitment
      {
        contractAddress: HIDEMI_CONTRACT_ADDRESS,
        entrypoint: "deposit",
        calldata: CallData.compile({
          hash: hashU256,
          asset: {
            amount: amountU256,
            addr: USDC_ADDRESS,
          },
        }),
      },
    ];

    try {
      // Preflight — simulate before spending gas
      const pre = await wallet.preflight({ calls, feeMode: "sponsored" });
      if (!pre.ok) {
        setErrorMsg(`Preflight failed: ${(pre as { reason?: string }).reason ?? "unknown"}`);
        setTxStatus("error");
        return;
      }

      // Execute sponsored via AVNU paymaster
      setTxStatus("executing");
      const tx = await wallet.execute(calls, { feeMode: "sponsored" });

      if (!tx.hash) {
        throw new Error("No transaction hash returned");
      }

      setTxHash(tx.hash);
      setTxStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      if (msg.includes("not deployed")) {
        setErrorMsg("Account not deployed. Reconnect via Cartridge to auto-deploy.");
      } else if (msg.includes("timed out") || msg.includes("429")) {
        setErrorMsg("Network timeout. Please try again.");
      } else if (msg.includes("signature") || msg.includes("Privy") || msg.includes("auth")) {
        setErrorMsg("Auth error. Reconnect your wallet and retry.");
      } else {
        setErrorMsg(msg);
      }
      setTxStatus("error");
    }
  }

  const busy = txStatus === "preflight" || txStatus === "executing";

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#12003a]">
      {/* Header */}
      <header className="flex w-full max-w-sm items-center gap-3 px-5 pt-10 pb-2">
        <button
          onClick={closePayment}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition-colors"
        >
          <BackIcon className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-white">Make Payment</h1>
      </header>

      <main className="w-full max-w-sm flex-1 space-y-5 px-5 pt-6 pb-10">
        {/* Scanned Transaction Secret */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              Scanned Transaction Secret
            </p>
          </div>
          <p className="break-all font-mono text-sm text-white leading-relaxed">
            {commitment || "—"}
          </p>
        </div>

        {/* USDC amount input */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            USDC Amount
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <input
              type="number"
              min="0"
              step="0.000001"
              placeholder="0.00"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(e.target.value)}
              disabled={busy || txStatus === "success"}
              className="flex-1 bg-transparent text-sm font-mono text-white placeholder-zinc-600 outline-none disabled:opacity-50"
            />
            <span className="text-xs font-semibold text-zinc-400">USDC</span>
          </div>
        </div>

        {/* TX details */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Transaction Details</h3>
          <InfoRow label="Contract" value={truncateAddress(HIDEMI_CONTRACT_ADDRESS, 8)} mono />
          <InfoRow label="Entrypoint" value="deposit" mono />
          <InfoRow label="Asset" value={`USDC (${truncateAddress(USDC_ADDRESS, 6)})`} mono />
          <InfoRow label="From" value={walletAddress ? truncateAddress(walletAddress, 8) : "—"} mono />
          <InfoRow label="Fee mode" value="Sponsored (AVNU)" />
        </div>

        {/* Status feedback */}
        {txStatus === "success" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-emerald-400">Deposit submitted!</p>
            {txHash && (
              <p className="mt-1 break-all font-mono text-xs text-emerald-300/70">{txHash}</p>
            )}
          </div>
        )}

        {txStatus === "error" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-400">Error</p>
            <p className="mt-1 text-xs text-red-300/70">{errorMsg}</p>
          </div>
        )}

        {/* Deposit button */}
        <button
          onClick={handleDeposit}
          disabled={busy || txStatus === "success" || !commitment || !getWallet() || !usdcAmount}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              {txStatus === "preflight" ? "Simulating…" : "Depositing…"}
            </span>
          ) : txStatus === "success" ? (
            "Deposited!"
          ) : (
            "Deposit USDC"
          )}
        </button>

        <FooterCredits className="mt-8" />
      </main>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs text-zinc-200 truncate max-w-[60%] text-right ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
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
