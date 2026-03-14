import type { Metadata } from "next";
import "./globals.css";
import { StarknetProvider } from "@/lib/starknet-provider";

export const metadata: Metadata = {
  title: "StarkZap - Private Payments",
  description: "Private payments on Starknet with QR codes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StarknetProvider>{children}</StarknetProvider>
      </body>
    </html>
  );
}
