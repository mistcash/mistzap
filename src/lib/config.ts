export const AVNU_API_KEY = "9243c745-1170-432a-a03b-3dacac4a2e9f";

export const HIDEMI_CONTRACT_ADDRESS =
  "0x04f4b828560e81705ac614a10242500b5e70a4286edfc01a0005b81e6b28e84a";

export const HIDEMI_ABI = [
  {
    name: "HidemiImpl",
    type: "impl",
    interface_name: "hidemi::IHidemi",
  },
  {
    name: "core::integer::u256",
    type: "struct",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" },
    ],
  },
  {
    name: "hidemi::IHidemi",
    type: "interface",
    items: [
      {
        name: "deposit",
        type: "function",
        inputs: [{ name: "tx_secret", type: "core::felt252" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "withdraw",
        type: "function",
        inputs: [
          { name: "tx_secret", type: "core::felt252" },
          { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "get_balance",
        type: "function",
        inputs: [
          { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        name: "get_deposit",
        type: "function",
        inputs: [{ name: "tx_secret", type: "core::felt252" }],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
    ],
  },
  {
    name: "constructor",
    type: "constructor",
    inputs: [
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
    ],
  },
  {
    type: "event",
    name: "hidemi::Hidemi::Event",
    kind: "enum",
    variants: [],
  },
] as const;
