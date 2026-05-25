interface Chain {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: string[] } };
}

export const BASE_CHAIN: Chain = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
};

// Solana Explorer base URL for transaction links
export const SOLANA_FM_BASE_URL = "https://orbmarkets.io/tx/";

// Base Explorer base URL for transaction links
export const BASE_EXPLORER_TX_URL = "https://basescan.org/tx/";

// Bubblemap API for holder distribution analysis
export const BUBBLEMAP_API_URL = process.env.NEXT_PUBLIC_BUBBLEMAP_API_URL;

export function getExplorerTxUrl(txHash: string, network?: string): string {
  if (network === 'base') return `${BASE_EXPLORER_TX_URL}${txHash}`;
  return `${SOLANA_FM_BASE_URL}${txHash}`;
}