/**
 * MISTzap SDK singleton and wallet helpers.
 *
 * Wraps the starkzap SDK with the AVNU paymaster configured,
 * and provides wallet connection flows for Cartridge, Argent X, and Braavos.
 */

import { StarkSDK, OnboardStrategy } from "starkzap";
import type { WalletInterface } from "starkzap";
import { AVNU_API_KEY, AVNU_BASE_URL, CORE_CONTRACT_ADDR, PaymentActivity } from "./config";
import { TOKEN_LIST } from "./tokens";
import type { TokenKey } from "./tokens";

export { connectWithArgent, connectWithBraavos, isArgentAvailable, isBraavosAvailable } from "./injected-wallet";

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
          target: CORE_CONTRACT_ADDR,
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

export type TokenBalances = Record<TokenKey, string>;

/**
 * Fetch balances for all supported tokens (USDC, ETH, WBTC, STRK).
 */
export async function getAllTokenBalances(wallet: WalletInterface): Promise<TokenBalances> {
  const results = await Promise.allSettled(
    TOKEN_LIST.map(async (token) => {
      const amount = await wallet.balanceOf(token);
      return { key: token.key, value: amount.toFormatted(true) };
    })
  );

  const balances: TokenBalances = { USDC: "—", ETH: "—", WBTC: "—", STRK: "—" };
  for (const result of results) {
    if (result.status === "fulfilled") {
      balances[result.value.key] = result.value.value;
    }
  }
  return balances;
}

/**
 * Read the USDC balance for a wallet (kept for backwards compat).
 */
export async function getUSDCBalance(wallet: WalletInterface): Promise<string> {
  try {
    const balances = await getAllTokenBalances(wallet);
    return balances.USDC;
  } catch {
    return "— USDC";
  }
}
