"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import type { WalletInterface } from "starkzap";
import { connectWithCartridge, disconnectWallet, getUSDCBalance } from "@/lib/starkzap";
import { generateSecretKey, getQRIndex } from "@/lib/crypto";
import type { PaymentActivity } from "@/lib/config";

export type Screen = "login" | "home" | "payment";

interface AppState {
  screen: Screen;
  walletAddress: string | null;
  secretKey: string | null;
  qrIndex: number;
  scannedPayload: string | null;
  balance: string;
  activity: PaymentActivity[];
  isConnecting: boolean;
  connectError: string | null;
}

interface AppActions {
  connectCartridge: () => Promise<void>;
  logout: () => Promise<void>;
  openPayment: (payload: string) => void;
  closePayment: () => void;
  refreshQRIndex: () => void;
  getWallet: () => WalletInterface | null;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

const MOCK_ACTIVITY: PaymentActivity[] = [
  {
    id: "1",
    type: "received",
    amount: "10.00 USDC",
    address: "0x049d3657...04dc7",
    timestamp: Date.now() - 3_600_000,
  },
  {
    id: "2",
    type: "sent",
    amount: "5.00 USDC",
    address: "0x04718f5a...b7dc",
    timestamp: Date.now() - 86_400_000,
  },
  {
    id: "3",
    type: "received",
    amount: "25.00 USDC",
    address: "0x06b5f6b3...a1e8",
    timestamp: Date.now() - 172_800_000,
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Keep the live WalletInterface in a ref so it never triggers re-renders
  const walletRef = useRef<WalletInterface | null>(null);

  const [state, setState] = useState<AppState>({
    screen: "login",
    walletAddress: null,
    secretKey: null,
    qrIndex: 0,
    scannedPayload: null,
    balance: "— USDC",
    activity: MOCK_ACTIVITY,
    isConnecting: false,
    connectError: null,
  });

  /** After a wallet is connected, hydrate app state from it */
  async function hydrateFromWallet(wallet: WalletInterface) {
    walletRef.current = wallet;
    const address = wallet.address;
    const [secretKey, balance] = await Promise.all([
      generateSecretKey(address),
      getUSDCBalance(wallet),
    ]);
    setState((s) => ({
      ...s,
      walletAddress: address,
      secretKey,
      qrIndex: getQRIndex(),
      balance,
      screen: "home",
      isConnecting: false,
      connectError: null,
    }));
  }

  // On mount: if the Cartridge controller already has a session, skip login
  useEffect(() => {
    // Cartridge sessions are ephemeral per page load; no auto-reconnect needed.
  }, []);

  const connectCartridge = useCallback(async () => {
    setState((s) => ({ ...s, isConnecting: true, connectError: null }));
    try {
      const wallet = await connectWithCartridge();
      await hydrateFromWallet(wallet);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Connection failed. Try again.";
      setState((s) => ({
        ...s,
        isConnecting: false,
        connectError: msg,
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    if (walletRef.current) {
      await disconnectWallet(walletRef.current).catch(() => { });
      walletRef.current = null;
    }
    setState((s) => ({
      ...s,
      walletAddress: null,
      secretKey: null,
      screen: "login",
      scannedPayload: null,
      connectError: null,
    }));
  }, []);

  const openPayment = useCallback((payload: string) => {
    setState((s) => ({ ...s, scannedPayload: payload, screen: "payment" }));
  }, []);

  const closePayment = useCallback(() => {
    setState((s) => ({ ...s, scannedPayload: null, screen: "home" }));
  }, []);

  const refreshQRIndex = useCallback(() => {
    setState((s) => ({ ...s, qrIndex: getQRIndex() }));
  }, []);

  const getWallet = useCallback(() => walletRef.current, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        connectCartridge,
        logout,
        openPayment,
        closePayment,
        refreshQRIndex,
        getWallet,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
