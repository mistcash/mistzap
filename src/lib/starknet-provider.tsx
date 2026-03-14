"use client";

import React from "react";
import { sepolia } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
  avnuPaymasterProvider,
} from "@starknet-react/core";
import { AVNU_API_KEY } from "./config";

const chains = [sepolia];
const connectors = [argent(), braavos()];
const paymasterProvider = avnuPaymasterProvider({ apiKey: AVNU_API_KEY });

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      chains={chains}
      provider={publicProvider()}
      connectors={connectors}
      paymasterProvider={paymasterProvider}
    >
      {children}
    </StarknetConfig>
  );
}
