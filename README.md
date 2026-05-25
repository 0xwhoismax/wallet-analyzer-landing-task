# Light Landing Page Task

This repo is a small extraction of the Light frontend. It includes the current landing page, its visual dependencies, Privy/Convex wiring, and a server route for calling the live wallet analyzer service.

The goal is to add wallet analyzer as a funnel option on the landing page. You can implement it however you think works best: embed it into the current layout, add a section, change the flow, or restructure the landing page if that gives a better result.

Prefer analyzing the user’s connected Solana wallet when they are signed in. If you support entering a wallet manually, keep the connected-wallet path as the primary/default flow.

The free analyzer flow should be limited to one request per IP. Do not rely only on client state for this; the UI can reflect the limit, but enforcement should happen through the API/rate-limit path.

Default/preferred timeframe is `180d`. Other supported timeframes can be exposed if useful, including `all`.

## Run

```bash
bun install
bun dev
```

Open `http://localhost:3000`.

You can install any packages you want.

## Env

Copy `.env.example` to `.env.local`.

```env
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_SOLANA_RPC_URL=

WALLET_ANALYZER_API_URL=
WALLET_ANALYZER_INTERNAL_SECRET=
```

`WALLET_ANALYZER_INTERNAL_SECRET` is server-only. Do not expose it with a `NEXT_PUBLIC_` name.

## Analyzer API

Call the local route from the frontend:

```http
POST /api/wallet-analyzer
Content-Type: application/json
Authorization: Bearer <Privy access token>
```

Body:

```json
{
  "wallet": "SolanaWalletAddress",
  "timeframe": "180d"
}
```

Supported timeframes: `30d`, `90d`, `180d`, `1y`, `all`.

The local route validates the wallet, checks the user through Privy/Convex, enforces the free-try IP limit, and forwards to:

```txt
${WALLET_ANALYZER_API_URL}/api/wallet-analyzer
```

It returns the analyzer service JSON.

## Useful Files

- `src/app/page.tsx` - landing page
- `src/app/api/wallet-analyzer/route.ts` - analyzer proxy route
- `src/app/providers.tsx` - minimal Privy/Convex/React Query/Jotai setup
- `src/lib/convex-api.ts` - remote Convex API references only; no backend code is included
