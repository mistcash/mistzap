// StarkZap configuration
export const HIDEMI_CONTRACT_ADDRESS =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

export const STARKNET_RPC_URL =
  "https://starknet-mainnet.public.blastapi.io/rpc/v0_7";

export const AVNU_API_KEY = "9243c745-1170-432a-a03b-3dacac4a2e9f";
export const AVNU_BASE_URL = "https://starknet.api.avnu.fi";

// Hidemi privacy payment contract ABI
// deposit(commitment: felt252) locks funds behind a secret commitment
export const HIDEMI_ABI = [
  {
    type: "interface",
    name: "hidemi::IHidemi",
    items: [
      {
        type: "function",
        name: "deposit",
        inputs: [
          {
            name: "commitment",
            type: "core::felt252",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "withdraw",
        inputs: [
          {
            name: "recipient",
            type: "core::starknet::ContractAddress",
          },
          {
            name: "nullifier_hash",
            type: "core::felt252",
          },
          {
            name: "root",
            type: "core::felt252",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "is_known_root",
        inputs: [
          {
            name: "root",
            type: "core::felt252",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_denomination",
        inputs: [],
        outputs: [
          {
            type: "core::felt252",
          },
        ],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "impl",
    name: "HidemiImpl",
    interface_name: "hidemi::IHidemi",
  },
  {
    type: "event",
    name: "hidemi::Hidemi::Deposit",
    kind: "struct",
    members: [
      {
        name: "commitment",
        type: "core::felt252",
        kind: "key",
      },
      {
        name: "leaf_index",
        type: "core::integer::u128",
        kind: "data",
      },
      {
        name: "timestamp",
        type: "core::integer::u64",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "hidemi::Hidemi::Withdrawal",
    kind: "struct",
    members: [
      {
        name: "recipient",
        type: "core::starknet::ContractAddress",
        kind: "key",
      },
      {
        name: "nullifier_hash",
        type: "core::felt252",
        kind: "key",
      },
    ],
  },
  {
    type: "event",
    name: "hidemi::Hidemi::Event",
    kind: "enum",
    variants: [
      {
        name: "Deposit",
        type: "hidemi::Hidemi::Deposit",
        kind: "nested",
      },
      {
        name: "Withdrawal",
        type: "hidemi::Hidemi::Withdrawal",
        kind: "nested",
      },
    ],
  },
] as const;

export type HidemiAbi = typeof HIDEMI_ABI;

// Mock activity data shape
export interface PaymentActivity {
  id: string;
  type: "sent" | "received";
  amount: string;
  address: string;
  timestamp: number;
  txHash?: string;
}
