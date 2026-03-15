/**
 * MISTzap SDK singleton and wallet helpers.
 *
 * Wraps the starkzap SDK with the AVNU paymaster configured,
 * and provides the Cartridge-based login flow for web.
 */

import { StarkSDK, OnboardStrategy, mainnetTokens } from "starkzap";
import type { WalletInterface } from "starkzap";
import { AVNU_API_KEY, AVNU_BASE_URL, HIDEMI_CONTRACT_ADDRESS } from "./config";

// Module-level singleton so the SDK isn't recreated on every login attempt
let _sdk: StarkSDK | null = null;

function getSDK(): StarkSDK {
  if (!_sdk) {
    _sdk = new StarkSDK({
      network: "mainnet",
      paymaster: {
        nodeUrl: AVNU_BASE_URL,
        headers: { "api-key": AVNU_API_KEY },
      },
    });
  }
  return _sdk;
}

/**
 * Opens the Cartridge Controller popup for social / passkey login.
 * Returns a connected WalletInterface on success.
 */
export async function connectWithCartridge(): Promise<WalletInterface> {
  const sdk = getSDK();

  const result = await sdk.onboard({
    strategy: OnboardStrategy.Cartridge,
    feeMode: "sponsored",
    cartridge: {
      // Declare the calls this session is allowed to make without per-tx approval
      policies: [
        {
          target: HIDEMI_CONTRACT_ADDRESS,
          method: "deposit",
        },
      ],
    },
  });

  return result.wallet;
}

/**
 * Disconnect the wallet cleanly.
 */
export async function disconnectWallet(wallet: WalletInterface): Promise<void> {
  await wallet.disconnect();
}

/**
 * Read the USDC balance for a wallet using the starkzap erc20 helper.
 */
export async function getUSDCBalance(wallet: WalletInterface): Promise<string> {
  try {
    const amount = await wallet.balanceOf(mainnetTokens.USDC);
    return amount.toFormatted(true);
  } catch {
    return "— USDC";
  }
}
