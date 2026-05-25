import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { PublicKey } from "@solana/web3.js";
import { api } from "@/lib/convex-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;
const ADMIN_TIMEFRAMES = new Set(["30d", "all"]);
const DEFAULT_TIMEFRAME = "180d";
const TIMEFRAME_DAYS: Record<string, number | null> = {
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "1y": 365,
  all: null,
};

type AnalyzerUser = {
  isAdmin: boolean;
  solanaWallets: Set<string>;
};

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const seenFreeTryIps = new Set<string>();

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

function enforceFreeTryLimit(req: NextRequest, user: AnalyzerUser | null) {
  if (user?.isAdmin) return null;
  if (req.headers.get("x-wallet-analyzer-free-try") !== "1") return null;

  const ip = clientIp(req);
  if (!seenFreeTryIps.has(ip)) {
    seenFreeTryIps.add(ip);
    return null;
  }

  return NextResponse.json(
    { error: "Free wallet analysis already used from this IP." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function normalizeWallet(value: unknown): string {
  const wallet = String(value ?? "").trim();
  if (wallet.length < 32 || wallet.length > 44 || !BASE58_RE.test(wallet)) {
    throw new Error("Enter a valid Solana wallet address.");
  }
  try {
    return new PublicKey(wallet).toBase58();
  } catch {
    throw new Error("Enter a valid Solana wallet address.");
  }
}

function normalizeTimeframe(value: unknown, legacyDays?: unknown): string {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw in TIMEFRAME_DAYS) return raw;
  const days = Number(legacyDays);
  if (Number.isFinite(days) && days > 0) {
    if (days <= 30) return "30d";
    if (days <= 90) return "90d";
    if (days <= 180) return "180d";
    if (days <= 365) return "1y";
  }
  return DEFAULT_TIMEFRAME;
}

function enforceTimeframeAccess(user: AnalyzerUser | null, timeframe: string) {
  if (!ADMIN_TIMEFRAMES.has(timeframe)) return null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  return null;
}

async function getAnalyzerUser(req: NextRequest): Promise<AnalyzerUser | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  try {
    const convex = new ConvexHttpClient(CONVEX_URL);
    convex.setAuth(token);
    const user = await convex.query(api.users.core.getCurrent);
    if (!user) return null;
    const addresses = (user.addresses ?? []) as Array<{ chainType: string; address: string }>;
    return {
      isAdmin: Boolean(user.isAdmin),
      solanaWallets: new Set(
        addresses
          .filter((address) => address.chainType === "solana")
          .map((address) => address.address.toLowerCase()),
      ),
    };
  } catch {
    return null;
  }
}

function enforceWalletAccess(req: NextRequest, wallet: string, user: AnalyzerUser | null) {
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  if (user.isAdmin) return null;

  const normalizedWallet = wallet.toLowerCase();
  if (user.solanaWallets.has(normalizedWallet)) return null;

  if (user.solanaWallets.size === 0 && req.headers.get("x-wallet-analyzer-free-try") === "1") return null;

  return NextResponse.json(
    { error: "You can only analyze your own Solana wallet." },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}

function analyzerServiceUrl(): string {
  const base = process.env.WALLET_ANALYZER_API_URL
    || process.env.BUBBLEMAP_API_URL
    || process.env.NEXT_PUBLIC_BUBBLEMAP_API_URL;
  if (!base) throw new HttpError("Wallet analyzer service URL is not configured.", 500);
  return `${base.replace(/\/+$/, "")}/api/wallet-analyzer`;
}

async function readServiceResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new HttpError(text || `Wallet analyzer service returned ${res.status}`, res.ok ? 502 : res.status);
  }

  if (!res.ok) {
    const message = data && typeof data === "object" && "error" in data
      ? String((data as { error: unknown }).error)
      : "Wallet analysis failed";
    throw new HttpError(message, res.status >= 500 ? 502 : res.status);
  }

  return data;
}

async function getAnalysis(wallet: string, timeframe: string): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.WALLET_ANALYZER_INTERNAL_SECRET) {
    headers.Authorization = `Bearer ${process.env.WALLET_ANALYZER_INTERNAL_SECRET}`;
  }

  try {
    const res = await fetch(analyzerServiceUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify({ wallet, timeframe }),
      cache: "no-store",
      signal: AbortSignal.timeout(290_000),
    });
    return readServiceResponse(res);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new HttpError("Wallet analysis timed out.", 504);
    }
    throw new HttpError(err instanceof Error ? err.message : "Wallet analysis failed", 502);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = normalizeWallet(body?.wallet);
    const timeframe = normalizeTimeframe(body?.timeframe, body?.days);
    const user = await getAnalyzerUser(req);
    const denied = enforceTimeframeAccess(user, timeframe);
    if (denied) return denied;
    const walletDenied = enforceWalletAccess(req, wallet, user);
    if (walletDenied) return walletDenied;
    const limited = enforceFreeTryLimit(req, user);
    if (limited) return limited;
    const result = await getAnalysis(wallet, timeframe);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Wallet analysis failed";
    const status = err instanceof HttpError ? err.status : message.includes("valid Solana wallet") ? 400 : 500;
    return jsonError(message, status);
  }
}

export async function GET(req: NextRequest) {
  try {
    const wallet = normalizeWallet(req.nextUrl.searchParams.get("wallet"));
    const timeframe = normalizeTimeframe(
      req.nextUrl.searchParams.get("timeframe"),
      req.nextUrl.searchParams.get("days"),
    );
    const user = await getAnalyzerUser(req);
    const denied = enforceTimeframeAccess(user, timeframe);
    if (denied) return denied;
    const walletDenied = enforceWalletAccess(req, wallet, user);
    if (walletDenied) return walletDenied;
    const limited = enforceFreeTryLimit(req, user);
    if (limited) return limited;
    const result = await getAnalysis(wallet, timeframe);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Wallet analysis failed";
    const status = err instanceof HttpError ? err.status : message.includes("valid Solana wallet") ? 400 : 500;
    return jsonError(message, status);
  }
}
