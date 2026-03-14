"use client";

import { useState } from "react";
import { RpcProvider, Contract, CallData } from "starknet";
import { useApp } from "@/app/context/AppContext";
import {
  HIDEMI_ABI,
  HIDEMI_CONTRACT_ADDRESS,
  STARKNET_RPC_URL,
  AVNU_API_KEY,
  AVNU_BASE_URL,
} from "@/lib/config";
import { truncateAddress } from "@/lib/crypto";

type TxStatus = "idle" | "building" | "signing" | "submitting" | "success" | "error";

export default function PaymentScreen() {
  const { scannedPayload, walletAddress, closePayment } = useApp();
  const [amount, setAmount] = useState("0.01");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const commitment = scannedPayload ?? "";

  async function handleDeposit() {
    if (!walletAddress || !commitment) return;
    setTxStatus("building");
    setErrorMsg("");

    try {
      const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });

      // Build the deposit calldata
      const calldata = CallData.compile({ commitment });

      const depositCall = {
        contractAddress: HIDEMI_CONTRACT_ADDRESS,
        entrypoint: "deposit",
        calldata,
      };

      setTxStatus("signing");

      // Attempt AVNU gasless (sponsored) transaction
      const gaslessResult = await tryAVNUSponsored(
        walletAddress,
        depositCall,
        provider
      );

      if (gaslessResult.success && gaslessResult.txHash) {
        setTxHash(gaslessResult.txHash);
        setTxStatus("success");
      } else {
        // Fall back: show the call that would be made
        setErrorMsg(
          gaslessResult.error ??
            "Paymaster unavailable. Connect a wallet signer to proceed."
        );
        setTxStatus("error");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus("error");
    }
  }

  const busy = ["building", "signing", "submitting"].includes(txStatus);

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
        {/* Scanned payload */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              Scanned Commitment
            </p>
          </div>
          <p className="break-all font-mono text-sm text-white">
            {commitment || "—"}
          </p>
        </div>

        {/* Contract info */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Transaction Details</h3>
          <InfoRow
            label="Contract"
            value={truncateAddress(HIDEMI_CONTRACT_ADDRESS, 8)}
            mono
          />
          <InfoRow label="Entrypoint" value="deposit" mono />
          <InfoRow label="From" value={truncateAddress(walletAddress ?? "", 8)} mono />
          <InfoRow label="Fee mode" value="Sponsored (AVNU)" />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Amount (ETH)
          </label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all disabled:opacity-50"
          />
        </div>

        {/* Status feedback */}
        {txStatus === "success" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-emerald-400">
              Deposit submitted!
            </p>
            {txHash && (
              <p className="mt-1 break-all font-mono text-xs text-emerald-300/70">
                {txHash}
              </p>
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
          disabled={busy || txStatus === "success" || !commitment}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              {txStatus === "building" && "Building transaction…"}
              {txStatus === "signing" && "Requesting signature…"}
              {txStatus === "submitting" && "Submitting…"}
            </span>
          ) : txStatus === "success" ? (
            "Deposited!"
          ) : (
            "Deposit"
          )}
        </button>

        <p className="text-center text-xs text-zinc-600">
          Transaction sponsored via AVNU paymaster
        </p>
      </main>
    </div>
  );
}

// --- AVNU Gasless Helper ---

interface GaslessResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

async function tryAVNUSponsored(
  userAddress: string,
  call: { contractAddress: string; entrypoint: string; calldata: string[] },
  _provider: RpcProvider
): Promise<GaslessResult> {
  try {
    // Step 1: Build typed data for gasless tx via AVNU
    const buildRes = await fetch(
      `${AVNU_BASE_URL}/paymaster/v1/build-typed-data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AVNU_API_KEY,
        },
        body: JSON.stringify({
          userAddress,
          calls: [
            {
              contractAddress: call.contractAddress,
              entrypoint: call.entrypoint,
              calldata: call.calldata,
            },
          ],
          // Use ETH as gas token
          gasTokenAddress:
            "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
        }),
      }
    );

    if (!buildRes.ok) {
      const text = await buildRes.text();
      return {
        success: false,
        error: `AVNU build-typed-data failed (${buildRes.status}): ${text.slice(0, 200)}`,
      };
    }

    const typedData = await buildRes.json();

    // Step 2: In a real app, the user's wallet signs typedData.
    // Without a live signer, we return the typed data for inspection.
    return {
      success: false,
      error:
        "Wallet signer required. AVNU typed data ready — connect ArgentX or Braavos to sign and submit. " +
        `Typed data hash: ${typedData?.message?.hash ?? "(see console)"}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "AVNU request failed",
    };
  }
}

// --- Sub-components ---

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-zinc-500">{label}</span>
      <span
        className={`text-xs text-zinc-200 ${mono ? "font-mono" : ""} truncate max-w-[60%] text-right`}
      >
        {value}
      </span>
    </div>
  );
}

function BackIcon({ className }: { className?: string }) {
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
