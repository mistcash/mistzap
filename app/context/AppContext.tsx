"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
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
  isLoadingKey: boolean;
}

interface AppActions {
  login: (address: string) => Promise<void>;
  logout: () => void;
  openPayment: (payload: string) => void;
  closePayment: () => void;
  refreshQRIndex: () => void;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

const WALLET_KEY = "starkzap_wallet";

const MOCK_ACTIVITY: PaymentActivity[] = [
  {
    id: "1",
    type: "received",
    amount: "0.05 ETH",
    address: "0x049d3657...04dc7",
    timestamp: Date.now() - 3600_000,
  },
  {
    id: "2",
    type: "sent",
    amount: "0.02 ETH",
    address: "0x04718f5a...b7dc",
    timestamp: Date.now() - 86400_000,
  },
  {
    id: "3",
    type: "received",
    amount: "0.1 ETH",
    address: "0x06b5f6b3...a1e8",
    timestamp: Date.now() - 172800_000,
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    screen: "login",
    walletAddress: null,
    secretKey: null,
    qrIndex: 0,
    scannedPayload: null,
    balance: "0.157 ETH",
    activity: MOCK_ACTIVITY,
    isLoadingKey: false,
  });

  // Auto-restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(WALLET_KEY);
    if (saved) {
      setState((s) => ({ ...s, isLoadingKey: true }));
      generateSecretKey(saved).then((key) => {
        setState((s) => ({
          ...s,
          walletAddress: saved,
          secretKey: key,
          qrIndex: getQRIndex(),
          screen: "home",
          isLoadingKey: false,
        }));
      });
    }
  }, []);

  const login = useCallback(async (address: string) => {
    setState((s) => ({ ...s, isLoadingKey: true }));
    const key = await generateSecretKey(address);
    localStorage.setItem(WALLET_KEY, address);
    setState((s) => ({
      ...s,
      walletAddress: address,
      secretKey: key,
      qrIndex: getQRIndex(),
      screen: "home",
      isLoadingKey: false,
    }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(WALLET_KEY);
    setState((s) => ({
      ...s,
      walletAddress: null,
      secretKey: null,
      screen: "login",
      scannedPayload: null,
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

  return (
    <AppContext.Provider
      value={{ ...state, login, logout, openPayment, closePayment, refreshQRIndex }}
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
