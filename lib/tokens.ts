import { mainnetTokens } from "starkzap";
import type { Token } from "starkzap";

export type TokenKey = "USDC" | "ETH" | "WBTC" | "STRK";

export const SUPPORTED_TOKENS: Record<TokenKey, Token> = {
  USDC: mainnetTokens.USDC,
  ETH: mainnetTokens.ETH,
  WBTC: mainnetTokens.WBTC,
  STRK: mainnetTokens.STRK,
};

export const TOKEN_LIST: Array<Token & { key: TokenKey }> = [
  { ...mainnetTokens.USDC, key: "USDC" as TokenKey },
  { ...mainnetTokens.ETH, key: "ETH" as TokenKey },
  { ...mainnetTokens.WBTC, key: "WBTC" as TokenKey },
  { ...mainnetTokens.STRK, key: "STRK" as TokenKey },
];

export const TOKEN_ICONS: Record<TokenKey, string> = {
  USDC: "💵",
  ETH: "◆",
  WBTC: "₿",
  STRK: "⚡",
};

export const DEFAULT_TOKEN_KEY: TokenKey = "USDC";
