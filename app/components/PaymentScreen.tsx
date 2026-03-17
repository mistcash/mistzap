"use client";

import { useState } from "react";
import { CallData, uint256 } from "starknet";
import { useApp } from "@/app/context/AppContext";
import { HIDEMI_CONTRACT_ADDRESS } from "@/lib/config";
import { truncateAddress } from "@/lib/crypto";
import { TOKEN_LIST, TOKEN_ICONS, DEFAULT_TOKEN_KEY, type TokenKey } from "@/lib/tokens";
import FooterCredits from "./FooterCredits";

type TxStatus = "idle" | "preflight" | "executing" | "success" | "error";

/** Parse a human-readable decimal string to base units (bigint) given token decimals */
function parseTokenAmount(input: string, decimals: number): bigint | null {
  const trimmed = input.trim();
  if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) return null;
  const parts = trimmed.split(".");
  const whole = BigInt(parts[0] || "0");
  let frac = BigInt(0);
  if (parts[1] !== undefined) {
    const fracStr = parts[1].slice(0, decimals).padEnd(decimals, "0");
    frac = BigInt(fracStr);
  }
  return whole * BigInt(10 ** decimals) + frac;
}

export default function PaymentScreen() {
  const { scannedPayload, walletAddress, walletType, closePayment, getWallet, tokenBalances } = useApp();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedTokenKey, setSelectedTokenKey] = useState<TokenKey>(DEFAULT_TOKEN_KEY);

  const commitment = scannedPayload ?? "";
  const selectedToken = TOKEN_LIST.find((t) => t.key === selectedTokenKey)!;
  const isSponsored = walletType === "cartridge";

  async function handleDeposit() {
    const wallet = getWallet();
    if (!wallet || !commitment) return;

    const amountBase = parseTokenAmount(amount, selectedToken.decimals);
    if (amountBase === null) {
      setErrorMsg(`Enter a valid ${selectedToken.symbol} amount greater than 0.`);
      setTxStatus("error");
      return;
    }

    setTxStatus("preflight");
    setErrorMsg("");

    const amountU256 = uint256.bnToUint256(amountBase);
    const hashU256 = uint256.bnToUint256(BigInt(commitment));

    const calls = [
      // Step 1: approve Hidemi to spend the chosen token
      {
        contractAddress: selectedToken.address,
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
            addr: selectedToken.address,
          },
        }),
      },
    ];

    const feeMode = isSponsored ? "sponsored" : "user_pays";

    try {
      // Preflight — simulate before spending gas
      const pre = await wallet.preflight({ calls, feeMode });
      if (!pre.ok) {
        setErrorMsg(`Preflight failed: ${(pre as { reason?: string }).reason ?? "unknown"}`);
        setTxStatus("error");
        return;
      }

      setTxStatus("executing");
      const tx = await wallet.execute(calls, { feeMode });

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
    <div className="flex min-h-screen flex-col items-center justify-start bg-linear-to-br from-[#040915] via-[#091329] to-[#0f1f3a]">
      {/* Header */}
      <header className="flex w-full max-w-sm items-center gap-3 px-5 pt-10 pb-2">
        <button
          onClick={closePayment}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#ff9d42]/25 bg-[#091329]/70 text-[#d8b58d] transition-colors hover:text-white"
        >
          <BackIcon className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-white">Make Payment</h1>
      </header>

      <main className="w-full max-w-sm flex-1 space-y-5 px-5 pt-6 pb-10">
        {/* Scanned Transaction Secret */}
        <div className="rounded-2xl border border-[#ff9d42]/30 bg-[#ef6105]/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-[#ff9d42] animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-[#ffb66b]">
              Scanned Transaction Secret
            </p>
          </div>
          <p className="break-all font-mono text-sm text-white leading-relaxed">
            {commitment || "—"}
          </p>
        </div>

        {/* Token selector */}
        <div className="rounded-2xl border border-[#ff9d42]/25 bg-[#091329]/70 p-4 space-y-3">
          <p className="text-xs font-semibold text-[#d8b58d] uppercase tracking-wider">
            Select Token
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TOKEN_LIST.map((token) => {
              const selected = token.key === selectedTokenKey;
              const balance = tokenBalances[token.key] ?? "—";
              return (
                <button
                  key={token.key}
                  onClick={() => { setSelectedTokenKey(token.key); setAmount(""); }}
                  disabled={busy || txStatus === "success"}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all disabled:opacity-50 ${selected
                    ? "border-[#ff9d42]/60 bg-[#ff9d42]/12"
                    : "border-[#ff9d42]/20 bg-[#091329]/60 hover:bg-[#11213d]"
                    }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{TOKEN_ICONS[token.key]}</span>
                    <span className={`text-sm font-semibold ${selected ? "text-[#ffb66b]" : "text-white"}`}>
                      {token.symbol}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#98775b] truncate w-full">
                    {balance}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount input */}
        <div className="rounded-2xl border border-[#ff9d42]/25 bg-[#091329]/70 p-4 space-y-2">
          <label className="text-xs font-semibold text-[#d8b58d] uppercase tracking-wider">
            Amount
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-[#ff9d42]/20 bg-[#091329]/80 px-3 py-2">
            <input
              type="number"
              min="0"
              step={selectedToken.decimals > 0 ? `0.${"0".repeat(selectedToken.decimals - 1)}1` : "1"}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy || txStatus === "success"}
              className="flex-1 bg-transparent text-sm font-mono text-white placeholder-[#98775b] outline-none disabled:opacity-50"
            />
            <span className="text-xs font-semibold text-[#ffb66b]">
              {TOKEN_ICONS[selectedTokenKey]} {selectedToken.symbol}
            </span>
          </div>
          <p className="text-xs text-[#98775b]">
            Balance: <span className="text-[#ffd7ae]">{tokenBalances[selectedTokenKey] ?? "—"}</span>
          </p>
        </div>

        {/* TX details */}
        <div className="rounded-2xl border border-[#ff9d42]/25 bg-[#091329]/70 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Transaction Details</h3>
          <InfoRow label="Contract" value={truncateAddress(HIDEMI_CONTRACT_ADDRESS, 8)} mono />
          <InfoRow label="Entrypoint" value="deposit" mono />
          <InfoRow label="Asset" value={`${selectedToken.symbol} (${truncateAddress(selectedToken.address, 6)})`} mono />
          <InfoRow label="From" value={walletAddress ? truncateAddress(walletAddress, 8) : "—"} mono />
          <InfoRow label="Fee mode" value={isSponsored ? "Sponsored (AVNU)" : "User pays"} />
        </div>

        {/* Status feedback */}
        {txStatus === "success" && (
          <div className="rounded-xl border border-[#ffb66b]/35 bg-[#ffb66b]/12 p-4">
            <p className="text-sm font-semibold text-[#ffb66b]">Deposit submitted!</p>
            {txHash && (
              <p className="mt-1 break-all font-mono text-xs text-[#ffe3c4]/70">{txHash}</p>
            )}
          </div>
        )}

        {txStatus === "error" && (
          <div className="rounded-xl border border-[#ef6105]/35 bg-[#ef6105]/12 p-4">
            <p className="text-sm font-semibold text-[#ff9d42]">Error</p>
            <p className="mt-1 text-xs text-[#ffd7ae]/70">{errorMsg}</p>
          </div>
        )}

        {/* Deposit button */}
        <button
          onClick={handleDeposit}
          disabled={busy || txStatus === "success" || !commitment || !getWallet() || !amount}
          className="w-full rounded-xl bg-linear-to-r from-[#ef6105] to-[#ff9d42] py-4 text-sm font-semibold text-[#220f00] shadow-[0_0_30px_rgba(255,126,27,0.35)] transition-all hover:from-[#ff7e1b] hover:to-[#ffb66b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              {txStatus === "preflight" ? "Simulating…" : "Depositing…"}
            </span>
          ) : txStatus === "success" ? (
            "Deposited!"
          ) : (
            `Deposit ${selectedToken.symbol}`
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
      <span className="text-xs text-[#98775b]">{label}</span>
      <span className={`max-w-[60%] truncate text-right text-xs text-[#ffd7ae] ${mono ? "font-mono" : ""}`}>
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
