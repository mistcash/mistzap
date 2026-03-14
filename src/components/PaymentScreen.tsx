"use client";

import { useState } from "react";
import { useAccount, useContract, useSendTransaction } from "@starknet-react/core";
import { HIDEMI_CONTRACT_ADDRESS, HIDEMI_ABI, AVNU_API_KEY } from "@/lib/config";

interface Props {
  txSecret: string;
  onClose: () => void;
}

export default function PaymentScreen({ txSecret, onClose }: Props) {
  const { address } = useAccount();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { contract } = useContract({
    address: HIDEMI_CONTRACT_ADDRESS,
    abi: HIDEMI_ABI,
  });

  const { sendAsync } = useSendTransaction({
    calls: [],
  });

  const handleDeposit = async () => {
    if (!contract || !address) return;

    setStatus("pending");
    setErrorMsg(null);

    try {
      const call = contract.populate("deposit", [txSecret]);

      const result = await sendAsync([call] as never);

      setTxHash(result.transaction_hash);
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Make Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Scanned TX Secret</p>
            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-sm font-mono text-yellow-400 break-all">{txSecret}</p>
            </div>
          </div>

          {status === "success" && txHash && (
            <div className="bg-green-400/10 rounded-xl px-4 py-3 border border-green-400/20">
              <p className="text-green-400 text-sm font-medium">Payment sent!</p>
              <p className="text-xs text-gray-400 font-mono mt-1 break-all">
                TX: {txHash}
              </p>
            </div>
          )}

          {status === "error" && errorMsg && (
            <div className="bg-red-400/10 rounded-xl px-4 py-3 border border-red-400/20">
              <p className="text-red-400 text-sm">{errorMsg}</p>
            </div>
          )}

          <button
            onClick={handleDeposit}
            disabled={status === "pending" || status === "success"}
            className={`w-full py-3 rounded-xl font-medium transition-colors ${
              status === "pending"
                ? "bg-yellow-400/20 text-yellow-400 cursor-wait"
                : status === "success"
                  ? "bg-green-400/20 text-green-400 cursor-default"
                  : "bg-yellow-400 text-black hover:bg-yellow-300"
            }`}
          >
            {status === "pending"
              ? "Sending..."
              : status === "success"
                ? "Done"
                : "Deposit"}
          </button>
        </div>
      </div>
    </div>
  );
}
