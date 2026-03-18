# MISTzap

**Private payments on Starknet.**

MISTzap lets you send and receive confidential payments using one-time QR codes and cryptographic commitments. No recipient address is exposed on-chain — only an opaque commitment hash that the receiver can later claim with their private key.

Built on [MIST.cash](https://mist.cash) infrastructure and the Hidemi privacy contract on Starknet.

---

## How It Works — User Experience

### Receiving a Payment

1. Connect your wallet (Cartridge, Argent X, or Braavos) on the login screen.
2. Tap **My QR Code**. The app generates a one-time QR payload derived from your wallet address and a per-device secret — without exposing your address.
3. Show or share the QR code with whoever is paying you.
4. The QR code is single-use by design. A new one is generated each time.

### Sending a Payment

1. Tap **Scan QR** and point your camera at the recipient's QR code.
2. Choose the token (USDC, ETH, WBTC, or STRK) and enter the amount.
3. Review the transaction details, then tap **Deposit**.
4. If you're on Cartridge, gas is sponsored — no fee required. Argent X and Braavos users pay their own gas.
5. On success, the funds are locked in the Hidemi contract under the recipient's commitment. The recipient claims them at any time using their private key.

### Activity

The home screen shows your recent private transaction history — amounts, tokens, and counterparties — fetched directly from the Hidemi contract using your device's secret key.

---

## How Private Payments Work — Technical Description

### 1. Device Identity and Secret Key Derivation

Each device generates a 16-byte **Device ID** on first launch and stores it in `localStorage`. The Device ID is user-visible and can be changed, but doing so invalidates all previously generated QR codes (by design — it's a privacy reset).

A **Secret Key** is derived deterministically:

```
secretKey = SHA-256("mistzap:" + walletAddress + ":" + deviceId)
```

This key never leaves the device. It is the root of all payment commitments for this wallet/device pair.

### 2. One-Time QR Payload Generation

Each QR code corresponds to an incrementing **QR Index** (also stored in `localStorage`). For each index, a **Claiming Key** is derived:

```
claimingKey = SHA-256(secretKey + ":" + qrIndex)  [truncated to 31 bytes / felt252]
```

The claiming key is then combined with the wallet address using the MistCash SDK's `hash2` function to produce the **Transaction Secret**:

```
transactionSecret = hash2(claimingKey, walletAddress)
```

This transaction secret is the QR payload — the hex string encoded in the QR code.

The sender never learns the wallet address or the claiming key. They only see the opaque commitment hash.

### 3. Deposit (Sender Side)

When a sender scans a QR code and submits a payment, the app constructs a two-step transaction:

1. **ERC-20 Approve** — authorize the Hidemi contract to spend the selected token amount.
2. **Hidemi Deposit** — call `deposit(hash, asset)` on the Hidemi contract:

```cairo
fn deposit(hash: felt252, asset: Asset)
  // hash  = transaction secret (the QR payload)
  // asset = { amount: u256, addr: ContractAddress }
```

**Contract address (Starknet Mainnet):**
```
0x075b21ada56ae65436cc80c616b71f9a9be87ba46e58f2330cf640e459318e11
```

The contract locks the funds against the commitment hash. Nobody can retrieve them without knowledge of the original claiming key.

#### Gas Fees

| Wallet | Fee Model |
|--------|-----------|
| Cartridge | Sponsored via AVNU paymaster — sender pays no gas |
| Argent X | User pays (standard Starknet gas) |
| Braavos | User pays (standard Starknet gas) |

Before execution, the app runs a **preflight simulation** to validate the transaction and surface errors before any signing occurs.

### 4. Claim (Receiver Side)

The receiver's wallet holds the secret key that can recompute the claiming key for any QR index. Submitting the claiming key to the Hidemi contract proves ownership of the commitment, which releases the funds to the wallet.

On-chain, the link between the commitment hash and the receiver's wallet address is never visible. The contract only stores `hash → asset`.

### 5. Activity Reconstruction

Transaction history is reconstructed privately on the client:

1. Iterate through all QR indices (0 to current index).
2. For each index, recompute the claiming key and query the Hidemi contract for `assets_from_secret`.
3. Display results locally — no third-party indexer required.

Only the device holding the secret key can see its own payment history.

---

## Architecture

```
mistzap/
├── app/
│   ├── context/AppContext.tsx    # Global state: screen, wallet, balances, activity
│   ├── components/
│   │   ├── LoginScreen.tsx       # Wallet connection (Cartridge / Argent X / Braavos)
│   │   ├── HomeScreen.tsx        # Dashboard: balances, QR buttons, activity feed
│   │   ├── PaymentScreen.tsx     # Deposit flow after scanning a QR code
│   │   ├── QRGenerateModal.tsx   # One-time receive QR generation
│   │   └── QRScanModal.tsx       # Camera-based QR scanner
│   ├── layout.tsx                # Root HTML structure and providers
│   └── page.tsx                  # Screen router
└── lib/
    ├── crypto.ts                 # Device ID, secret key derivation, QR payload generation
    ├── starkzap.ts               # Wallet connections, token balance fetching
    ├── injected-wallet.ts        # Adapter for Argent X and Braavos browser extensions
    ├── config.ts                 # Contract addresses, ABIs, RPC URL, paymaster config
    └── tokens.tsx                # Token metadata (USDC, ETH, WBTC, STRK)
```

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `starkzap` | Wallet and transaction abstraction for Starknet |
| `starknet` | Low-level RPC client and contract interactions |
| `@mistcash/sdk` | `hash2` and `getChamber` privacy primitives |
| `@cartridge/controller` | Cartridge social login and session management |
| `@avnu/avnu-sdk` | Paymaster for sponsored (gasless) transactions |
| `html5-qrcode` | Camera QR code scanning |
| `qrcode.react` | QR code image generation |

---

## Running Locally

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Camera access for QR scanning requires HTTPS in most browsers; use a tunnel or the experimental HTTPS flag:

```bash
npm run dev -- --experimental-https
```

### Requirements

- Node.js 20+
- A browser with camera access (for QR scanning)
- Argent X or Braavos extension installed, or a Cartridge account

---

## Smart Contracts

| Contract | Address |
|----------|---------|
| Hidemi (privacy vault) | `0x075b21ada56ae65436cc80c616b71f9a9be87ba46e58f2330cf640e459318e11` |
| USDC | `0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb` |

Network: **Starknet Mainnet**
RPC: `https://rpc.starknet.lava.build`

---

## Privacy Properties

- **No address exposure on-chain.** Deposits are indexed by commitment hash, not by wallet address.
- **One-time commitments.** Each QR code produces a unique hash; reuse is not possible.
- **Client-side key derivation.** The secret key never leaves the device.
- **Private activity history.** Only the device with the correct secret key can reconstruct transaction history.
- **Device ID portability.** Users can change their Device ID to rotate all keys, effectively unlinking their payment history (at the cost of losing access to unclaimed funds from old QR codes).

---

## Built With

- [Next.js](https://nextjs.org/) — React framework
- [Starknet](https://www.starknet.io/) — L2 blockchain
- [MIST.cash](https://mist.cash) — Privacy infrastructure
- [Cartridge](https://cartridge.gg/) — Onchain gaming and app accounts
