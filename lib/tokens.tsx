import { ReactNode } from "react";
import { mainnetTokens } from "starkzap";
import Image from "next/image";
import type { Token } from "starkzap";

export type TokenKey = "USDC" | "ETH" | "WBTC" | "STRK";
const { USDC, ETH, WBTC, STRK } = mainnetTokens;

export const SUPPORTED_TOKENS: Record<TokenKey, Token> = { USDC, ETH, WBTC, STRK };

export const TOKEN_LIST: Array<Token & { key: TokenKey }> = [
  { ...USDC, key: "USDC" as TokenKey },
  { ...ETH, key: "ETH" as TokenKey },
  { ...WBTC, key: "WBTC" as TokenKey },
  { ...STRK, key: "STRK" as TokenKey },
];

export const TOKEN_ICONS: Record<TokenKey, ReactNode> = {
  USDC: <Image src={USDC.metadata.logoUrl.href} alt={USDC.symbol} width={32} height={32} />,
  ETH: <Image src={ETH.metadata.logoUrl.href} alt={ETH.symbol} width={32} height={32} />,
  WBTC: <Image src={WBTC.metadata.logoUrl.href} alt={WBTC.symbol} width={32} height={32} />,
  STRK: <Image src={STRK.metadata.logoUrl.href} alt={STRK.symbol} width={32} height={32} />,
};

export const DEFAULT_TOKEN_KEY: TokenKey = "USDC";
