"use client";

import { useConnect } from "@starknet-react/core";

export default function LoginScreen() {
  const { connect, connectors } = useConnect();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white px-4">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        <div className="flex flex-col items-center gap-2">
          <div className="text-5xl font-bold tracking-tight">
            <span className="text-yellow-400">Stark</span>
            <span className="text-white">Zap</span>
          </div>
          <p className="text-gray-400 text-sm">Private payments on Starknet</p>
        </div>

        <div className="w-20 h-20 rounded-full bg-yellow-400/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => connect({ connector })}
              className="w-full rounded-xl bg-white/10 hover:bg-white/20 transition-colors py-3 px-4 text-base font-medium backdrop-blur-sm border border-white/10"
            >
              Connect with {connector.name}
            </button>
          ))}
        </div>

        <p className="text-gray-500 text-xs text-center">
          Connect your Starknet wallet to get started
        </p>
      </div>
    </div>
  );
}
