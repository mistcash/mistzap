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
import {
  connectWithCartridge,
  connectWithArgent,
  connectWithBraavos,
  disconnectWallet,
  getAllTokenBalances,
  type TokenBalances,
} from "@/lib/starkzap";
import { getPrivateTxActivity, getQRIndex } from "@/lib/crypto";
import type { PaymentActivity } from "@/lib/config";
import type { TokenKey } from "@/lib/tokens";

export type Screen = "login" | "home" | "payment";
export type WalletType = "cartridge" | "argent" | "braavos";

interface AppState {
  screen: Screen;
  walletAddress: string | null;
  walletType: WalletType | null;
  qrIndex: number;
  scannedPayload: string | null;
  tokenBalances: TokenBalances;
  activity: PaymentActivity[];
  isConnecting: boolean;
  connectError: string | null;
}

interface AppActions {
  connectCartridge: () => Promise<void>;
  connectArgent: () => Promise<void>;
  connectBraavos: () => Promise<void>;
  logout: () => Promise<void>;
  openPayment: (payload: string) => void;
  closePayment: () => void;
  refreshQRIndex: () => void;
  getWallet: () => WalletInterface | null;
  getTokenBalance: (key: TokenKey) => string;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

const MOCK_ACTIVITY: PaymentActivity[] = [
  {
    id: 1,
    type: "received",
    amount: "10.00 USDC",
    token: "USDC",
    claimingKey: "0x01",
    recipient: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  },
  {
    id: 2,
    type: "withdrawn",
    amount: "5.00 USDC",
    token: "USDC",
    claimingKey: "0x02",
    recipient: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5d22b8f0cf248d7d4f2e53ab7dc",
  },
  {
    id: 3,
    type: "received",
    amount: "25.00 USDC",
    token: "USDC",
    claimingKey: "0x03",
    recipient: "0x06b5f6b3f5b709f6682a490f0f4cb6f7a3c03a65ac76da68f29d7f548351a1e8",
  },
];

const EMPTY_BALANCES: TokenBalances = { USDC: "—", ETH: "—", WBTC: "—", STRK: "—" };

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Keep the live WalletInterface in a ref so it never triggers re-renders
  const walletRef = useRef<WalletInterface | null>(null);

  const [state, setState] = useState<AppState>({
    screen: "login",
    walletAddress: null,
    walletType: null,
    qrIndex: getQRIndex(),
    scannedPayload: null,
    tokenBalances: EMPTY_BALANCES,
    activity: MOCK_ACTIVITY,
    isConnecting: false,
    connectError: null,
  });

  /** After a wallet is connected, hydrate app state from it */
  async function hydrateFromWallet(wallet: WalletInterface, walletType: WalletType) {
    walletRef.current = wallet;
    const address = wallet.address;

    // Kick off all 4 balance fetches in parallel
    const tokenBalances = await getAllTokenBalances(wallet);
    const activity = await getPrivateTxActivity(wallet, state.qrIndex);

    setState((s) => ({
      ...s,
      walletAddress: address,
      walletType,
      qrIndex: getQRIndex(),
      tokenBalances,
      activity,
      screen: "home",
      isConnecting: false,
      connectError: null,
    }));
  }

  // On mount: Cartridge sessions are ephemeral per page load; no auto-reconnect needed.
  useEffect(() => { }, []);

  async function handleConnect(type: WalletType, connectFn: () => Promise<WalletInterface>) {
    setState((s) => ({ ...s, isConnecting: true, connectError: null }));
    try {
      const wallet = await connectFn();
      await hydrateFromWallet(wallet, type);
    } catch (err) {
      console.error("Connection error:", err);
      const msg =
        err instanceof Error ? err.message : "Connection failed. Try again.";
      setState((s) => ({
        ...s,
        isConnecting: false,
        connectError: msg,
      }));
    }
  }

  const connectCartridge = useCallback(
    () => handleConnect("cartridge", connectWithCartridge),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const connectArgent = useCallback(
    () => handleConnect("argent", connectWithArgent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const connectBraavos = useCallback(
    () => handleConnect("braavos", connectWithBraavos),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const logout = useCallback(async () => {
    if (walletRef.current) {
      await disconnectWallet(walletRef.current).catch(() => { });
      walletRef.current = null;
    }
    setState((s) => ({
      ...s,
      walletAddress: null,
      walletType: null,
      screen: "login",
      scannedPayload: null,
      tokenBalances: EMPTY_BALANCES,
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

  const getTokenBalance = useCallback(
    (key: TokenKey) => state.tokenBalances[key] ?? "—",
    [state.tokenBalances]
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        connectCartridge,
        connectArgent,
        connectBraavos,
        logout,
        openPayment,
        closePayment,
        refreshQRIndex,
        getWallet,
        getTokenBalance,
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
