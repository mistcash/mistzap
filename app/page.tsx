"use client";

import { useApp } from "@/app/context/AppContext";
import LoginScreen from "@/app/components/LoginScreen";
import HomeScreen from "@/app/components/HomeScreen";
import PaymentScreen from "@/app/components/PaymentScreen";

export default function Page() {
  const { screen } = useApp();

  if (screen === "login") return <LoginScreen />;
  if (screen === "payment") return <PaymentScreen />;
  return <HomeScreen />;
}
