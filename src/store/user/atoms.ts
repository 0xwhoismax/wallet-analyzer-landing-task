import { atom, useAtomValue } from "jotai";
import type { DelegatedWallet, UserProfileData, WalletAccount } from "./types";

export const privyAuthStateAtom = atom({
  authenticated: false,
  ready: false,
});

export const privyAccessTokenAtom = atom<string | null>(null);

type UserState = {
  ready: boolean;
  profileData: UserProfileData | null;
  loading: boolean;
  walletAccounts: WalletAccount[];
  delegatedWallets: DelegatedWallet[];
  logout: () => Promise<void> | void;
};

export const userStateAtom = atom<UserState>({
  ready: false,
  profileData: null,
  loading: true,
  walletAccounts: [],
  delegatedWallets: [],
  logout: async () => {},
});

export const useUser = () => useAtomValue(userStateAtom);

export const currentUserIdAtom = atom((get) => get(userStateAtom).profileData?.id ?? null);

export const isAdminAtom = atom((get) => {
  const privyAuth = get(privyAuthStateAtom);
  const userState = get(userStateAtom);
  if (!privyAuth.authenticated || !privyAuth.ready || !userState.ready || !userState.profileData) return false;
  return userState.profileData.role === "admin";
});

export const activeTradingWalletAtom = atom((get) => {
  const userState = get(userStateAtom);
  return userState.delegatedWallets.find((wallet) => wallet.chainType === "solana")
    ?? userState.walletAccounts.find((wallet) => wallet.chainType === "solana");
});
