/**
 * Adapter for browser-injected Starknet wallets (Argent X, Braavos).
 *
 * These wallets inject a provider into `window.starknet_argentX` or
 * `window.starknet_braavos`. This adapter wraps them to expose the
 * same interface the app uses for Cartridge wallets.
 */

import { Amount } from "starkzap";
import type { WalletInterface } from "starkzap";
import type { Token } from "starkzap";
import { RpcProvider, uint256, type Call } from "starknet";
import { STARKNET_RPC_URL } from "./config";

// Minimal shape of the browser wallet window object
interface StarknetWindowObject {
  isConnected: boolean;
  selectedAddress?: string;
  account?: {
    address: string;
    execute: (calls: Call[]) => Promise<{ transaction_hash: string }>;
  };
  request: (params: { type: string; params?: unknown }) => Promise<unknown>;
  enable: () => Promise<string[]>;
}

declare global {
  interface Window {
    starknet_argentX?: StarknetWindowObject;
    starknet_braavos?: StarknetWindowObject;
  }
}

/**
 * Wraps a browser-injected wallet in a minimal interface compatible with
 * the methods the app calls: execute, preflight, balanceOf, disconnect.
 *
 * Stubs are provided for the rest of WalletInterface so TypeScript is happy.
 */
class InjectedWalletAdapter {
  readonly address: string;
  private readonly wallet: StarknetWindowObject;
  private readonly _provider: RpcProvider;

  constructor(wallet: StarknetWindowObject, address: string) {
    this.wallet = wallet;
    this.address = address;
    this._provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
  }

  async execute(calls: Call[], _options?: unknown): Promise<{ hash: string }> {
    if (!this.wallet.account) throw new Error("Wallet not connected");
    const result = await this.wallet.account.execute(calls);
    return { hash: result.transaction_hash };
  }

  async preflight(_options: unknown): Promise<{ ok: true }> {
    // Browser wallets handle their own simulation during confirmation popup
    return { ok: true };
  }

  async balanceOf(token: Token): Promise<Amount> {
    try {
      const res = await this._provider.callContract({
        contractAddress: token.address,
        entrypoint: "balance_of",
        calldata: [this.address],
      });
      const raw = uint256.uint256ToBN({ low: res[0], high: res[1] });
      return Amount.fromRaw(raw, token);
    } catch {
      return Amount.fromRaw(0, token);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.wallet.request({ type: "wallet_disconnectWallet" });
    } catch {
      // Ignore disconnect errors — extension may not support this call
    }
  }

  // Stubs for unused WalletInterface methods
  async isDeployed() { return true; }
  async ensureReady() { /* no-op */ }
  async deploy(): Promise<never> { throw new Error("Not supported"); }
  callContract(call: Parameters<WalletInterface["callContract"]>[0]) {
    return this._provider.callContract(call);
  }
  tx(): never { throw new Error("Not supported"); }
  async signMessage(): Promise<never> { throw new Error("Not supported"); }
  getAccount(): never { throw new Error("Not supported"); }
  getProvider() { return this._provider; }
  getChainId(): never { throw new Error("Not supported"); }
  getFeeMode() { return "user_pays" as const; }
  getClassHash() { return ""; }
  async estimateFee(): Promise<never> { throw new Error("Not supported"); }
  erc20(): never { throw new Error("Not supported"); }
  async transfer(): Promise<never> { throw new Error("Not supported"); }
  async staking(): Promise<never> { throw new Error("Not supported"); }
  async stakingInStaker(): Promise<never> { throw new Error("Not supported"); }
  async enterPool(): Promise<never> { throw new Error("Not supported"); }
  async addToPool(): Promise<never> { throw new Error("Not supported"); }
  async stake(): Promise<never> { throw new Error("Not supported"); }
  async claimPoolRewards(): Promise<never> { throw new Error("Not supported"); }
  async exitPoolIntent(): Promise<never> { throw new Error("Not supported"); }
  async exitPool(): Promise<never> { throw new Error("Not supported"); }
  async isPoolMember() { return false; }
  async getPoolPosition() { return null; }
  async getPoolCommission() { return 0; }
}

async function connectInjected(wallet: StarknetWindowObject): Promise<WalletInterface> {
  const addresses = await wallet.enable();
  const address = addresses[0] ?? wallet.selectedAddress ?? wallet.account?.address;
  if (!address) throw new Error("No account found in wallet");
  return new InjectedWalletAdapter(wallet, address) as unknown as WalletInterface;
}

export async function connectWithArgent(): Promise<WalletInterface> {
  if (typeof window === "undefined" || !window.starknet_argentX) {
    throw new Error("Argent X not detected. Install the Argent X browser extension.");
  }
  return connectInjected(window.starknet_argentX);
}

export async function connectWithBraavos(): Promise<WalletInterface> {
  if (typeof window === "undefined" || !window.starknet_braavos) {
    throw new Error("Braavos not detected. Install the Braavos browser extension.");
  }
  return connectInjected(window.starknet_braavos);
}

export function isArgentAvailable(): boolean {
  return typeof window !== "undefined" && !!window.starknet_argentX;
}

export function isBraavosAvailable(): boolean {
  return typeof window !== "undefined" && !!window.starknet_braavos;
}
