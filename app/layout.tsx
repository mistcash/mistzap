import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/app/context/AppContext";

export const metadata: Metadata = {
  title: "MISTzap — Private Payments on Starknet",
  description: "Privacy-preserving payment app built on Starknet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
