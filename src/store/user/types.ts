export interface WalletAccount {
  id: string;
  address: string;
  chainType: "solana" | "evm";
}

export interface DelegatedWallet {
  id: string;
  address: string;
  chainType: "solana" | "ethereum";
}

export interface UserProfileData {
  id: string;
  role?: "user" | "admin";
}
