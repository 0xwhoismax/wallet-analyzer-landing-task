"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProviderWithAuth } from "convex/react";
import { Provider as JotaiProvider, useAtomValue, useSetAtom } from "jotai";
import { queryClientAtom } from "jotai-tanstack-query";
import { PropsWithChildren, useCallback, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { WalletWithMetadata } from "@privy-io/react-auth";
import { PrivyClientProvider } from "@/providers/PrivyProvider";
import { convex, convexHttp } from "@/lib/convex";
import { api } from "@/lib/convex";
import { privyAccessTokenAtom, privyAuthStateAtom, userStateAtom } from "@/store/user/atoms";
import { store } from "@/store/store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

store.set(queryClientAtom, queryClient);

export function Providers({ children }: PropsWithChildren) {
  return (
    <PrivyClientProvider>
      <JotaiProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
            <UserHydrator />
            {children}
          </ConvexProviderWithAuth>
        </QueryClientProvider>
      </JotaiProvider>
    </PrivyClientProvider>
  );
}

function useConvexAuth() {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const latestToken = useAtomValue(privyAccessTokenAtom);

  const fetchAccessToken = useCallback(async () => {
    if (!ready || !authenticated) return null;
    return await getAccessToken();
  }, [authenticated, getAccessToken, ready]);

  return {
    isLoading: !ready,
    isAuthenticated: ready && authenticated && Boolean(latestToken),
    fetchAccessToken,
  };
}

function UserHydrator() {
  const { ready, authenticated, user, getAccessToken, logout } = usePrivy();
  const setUserState = useSetAtom(userStateAtom);
  const setPrivyAuth = useSetAtom(privyAuthStateAtom);
  const setAccessToken = useSetAtom(privyAccessTokenAtom);

  useEffect(() => {
    setPrivyAuth({ ready, authenticated });
  }, [authenticated, ready, setPrivyAuth]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (!ready) return;

      if (!authenticated) {
        convexHttp.setAuth("");
        setAccessToken(null);
        setUserState((prev) => ({
          ...prev,
          ready: true,
          loading: false,
          profileData: null,
          walletAccounts: [],
          delegatedWallets: [],
          logout,
        }));
        return;
      }

      setUserState((prev) => ({ ...prev, loading: true, logout }));
      const token = await getAccessToken();
      if (cancelled) return;
      convexHttp.setAuth(token ?? "");
      setAccessToken(token ?? null);

      const linkedWallets = Array.isArray(user?.linkedAccounts)
        ? (user.linkedAccounts as WalletWithMetadata[]).filter((account) => account.type === "wallet")
        : [];
      const walletAccounts = linkedWallets.map((wallet) => ({
        id: wallet.address,
        address: wallet.address,
        chainType: wallet.chainType === "ethereum" ? "evm" as const : "solana" as const,
      }));
      const delegatedWallets = linkedWallets
        .filter((wallet) => wallet.chainType === "solana" && Boolean((wallet as WalletWithMetadata & { delegated?: boolean }).delegated))
        .map((wallet) => ({
          id: wallet.address,
          address: wallet.address,
          chainType: "solana" as const,
        }));

      let role: "user" | "admin" | undefined;
      let id: string | null = null;
      if (token) {
        try {
          const current = await convexHttp.query(api.users.core.getCurrent, {});
          if (!cancelled && current && typeof current === "object") {
            const convexUser = current as { _id?: string; id?: string; role?: "user" | "admin"; isAdmin?: boolean };
            id = convexUser._id ?? convexUser.id ?? null;
            role = convexUser.isAdmin ? "admin" : convexUser.role ?? "user";
          }
        } catch {
          role = "user";
        }
      }

      if (cancelled) return;
      setUserState((prev) => ({
        ...prev,
        ready: true,
        loading: false,
        profileData: id ? { id, role: role ?? "user" } : null,
        walletAccounts,
        delegatedWallets: delegatedWallets.length > 0
          ? delegatedWallets
          : walletAccounts
            .filter((wallet) => wallet.chainType === "solana")
            .map((wallet) => ({ id: wallet.id, address: wallet.address, chainType: "solana" as const })),
        logout,
      }));
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [authenticated, getAccessToken, logout, ready, setAccessToken, setUserState, setPrivyAuth, user?.linkedAccounts]);

  useEffect(() => {
    const id = setInterval(async () => {
      if (!ready || !authenticated) return;
      const token = await getAccessToken();
      convexHttp.setAuth(token ?? "");
      setAccessToken(token ?? null);
    }, 60_000);
    return () => clearInterval(id);
  }, [authenticated, getAccessToken, ready, setAccessToken]);

  return null;
}
