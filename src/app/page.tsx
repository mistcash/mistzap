"use client";

import { useAccount } from "@starknet-react/core";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}
