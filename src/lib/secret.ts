import { sha256 } from "js-sha256";

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("starkzap_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("starkzap_device_id", id);
  }
  return id;
}

export function generateSecretKey(walletAddress: string): string {
  const deviceId = getDeviceId();
  const input = `${walletAddress.toLowerCase()}:${deviceId}`;
  return "0x" + sha256(input);
}

export function generateIndexedSecret(secretKey: string, index: number): string {
  const input = `${secretKey}:${index}`;
  return "0x" + sha256(input);
}

export function getNextIndex(): number {
  if (typeof window === "undefined") return 0;
  const current = parseInt(localStorage.getItem("starkzap_qr_index") || "0", 10);
  localStorage.setItem("starkzap_qr_index", String(current + 1));
  return current;
}

export function getCurrentIndex(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("starkzap_qr_index") || "0", 10);
}
