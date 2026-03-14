// Deterministic secret key generation for StarkZap

import { hash2 } from "@mistcash/sdk";

const DEVICE_ID_KEY = "starkzap_device_id";
const QR_INDEX_KEY = "starkzap_qr_index";

/** Returns a persistent device identifier stored in localStorage */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    id = Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Generates a deterministic 32-byte secret key from wallet address + device ID.
 * Uses SHA-256 via Web Crypto API.
 */
export async function generateSecretKey(walletAddress: string): Promise<string> {
  const deviceId = getDeviceId();
  const combined = `starkzap:${walletAddress.toLowerCase()}:${deviceId}`;
  const encoded = new TextEncoder().encode(combined);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Returns a one-time QR payload for a wallet + index without exposing the raw secret key
 * to UI components. Secret derivation remains internal to this module.
 */
export async function generateQRPayloadForIndex(
  walletAddress: string,
  index: number
): Promise<string> {
  const secretKey = await generateSecretKey(walletAddress);
  const indexHex = index.toString(16).padStart(8, "0");
  const combined = `${secretKey}:${indexHex}`;
  const encoded = new TextEncoder().encode(combined);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Truncate to 31 bytes to fit in a Starknet felt252
  const claimingKey = "0x" + hashArray.slice(0, 31).map((b) => b.toString(16).padStart(2, "0")).join("");

  // Generate transaction secret commitment used by deposit.
  // SDK docs define this as hashing recipient wallet + claiming key.
  const txSecret = await hash2(walletAddress, claimingKey);

  return txSecret;
}

/** Gets the current QR index from localStorage */
export function getQRIndex(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(QR_INDEX_KEY) ?? "0", 10);
}

/** Increments and persists the QR index, returns the new value */
export function incrementQRIndex(): number {
  const next = getQRIndex() + 1;
  if (typeof window !== "undefined") {
    localStorage.setItem(QR_INDEX_KEY, String(next));
  }
  return next;
}

/** Formats a hex address for display (0x1234...abcd) */
export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/** Validates a Starknet address (0x prefixed hex, 1-63 hex chars after prefix) */
export function isValidStarknetAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{1,63}$/.test(addr);
}
