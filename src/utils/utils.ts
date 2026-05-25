import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address?: string, prefixLength = 9): string {
  if (!address || address.length <= prefixLength + 7) return address ?? "";
  return `${address.slice(0, prefixLength)}...${address.slice(-4)}`;
}

/** Map known Solana JSON-RPC error codes to user-friendly messages */
const SOLANA_ERROR_MESSAGES: Record<number, string> = {
  [-32002]: "Network is congested. Please try again.",
  [-32003]: "Transaction verification failed. Please try again.",
  [-32004]: "Solana node is temporarily unavailable. Please try again.",
  [-32005]: "Network is processing. Please try again in a moment.",
  [-32006]: "Network is syncing. Please try again.",
  [-32007]: "Transaction version not supported.",
  [-32009]: "Transaction expired. Please try again.",
  [-32010]: "Transaction already processed.",
  [-32602]: "Invalid transaction parameters.",
};

/** Common Solana on-chain / simulation error substrings → friendly messages */
const SOLANA_SUBSTRING_MESSAGES: Array<[RegExp, string]> = [
  [/insufficient\s*(lamports|funds)/i, "Insufficient SOL balance for this transaction."],
  [/InsufficientFundsForRent/i, "Not enough SOL to cover rent. Keep a small SOL balance."],
  [/SlippageToleranceExceeded|Slippage/i, "Price moved too much (slippage). Try again or increase slippage."],
  [/blockhash\s*not\s*found/i, "Transaction expired. Please try again."],
  [/Program failed to complete/i, "Transaction failed on-chain. Please try again."],
  [/custom program error:\s*0x1($|\s)/i, "Insufficient token balance for this swap."],
  [/"InstructionError":\[\d+,{"Custom":(?:6002|6003|6042)}\]/i, "Slippage exceeded. Try again or increase slippage tolerance."],
  [/custom program error:\s*0x1771/i, "Slippage exceeded. Try again or increase slippage tolerance."],
  [/custom program error:\s*0x1772/i, "Slippage exceeded. Try again or increase slippage tolerance."],
  [/custom program error:\s*0x179a/i, "Slippage exceeded. Try again or increase slippage tolerance."],
];

/** Extract a user-friendly message from Solana/RPC errors.
 *  Returns null if the error doesn't look like a Solana error. */
function humanizeSolanaError(raw: string): string | null {
  // Match Solana error code pattern: "Solana error #-32002" or "error code: -32002"
  const codeMatch = raw.match(/(?:Solana error #|error code:\s*)(-?\d+)/i);
  if (codeMatch) {
    const code = parseInt(codeMatch[1], 10);
    if (SOLANA_ERROR_MESSAGES[code]) return SOLANA_ERROR_MESSAGES[code];
  }

  // Match known error substrings
  for (const [pattern, message] of SOLANA_SUBSTRING_MESSAGES) {
    if (pattern.test(raw)) return message;
  }

  // If the message is extremely long (encoded Solana errors), provide generic message
  if (raw.length > 300 && /solana|transaction|blockhash|lamport/i.test(raw)) {
    return "Transaction failed. Please try again.";
  }

  return null;
}

/** Strip Convex server error wrapper to get the clean message.
 *  e.g. "[CONVEX A(...)] [Request ID: ...] Server Error Uncaught Error: actual msg" → "actual msg"
 *  e.g. "[CONVEX A(...)] [Request ID: ...] Server Error" → fallback
 *  Also handles raw Solana/RPC errors with human-readable messages. */
export function cleanErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");

  // Check for Solana-specific errors first (these can be very long/cryptic)
  const solanaMsg = humanizeSolanaError(raw);
  if (solanaMsg) return solanaMsg;

  // Try to extract message after "Uncaught Error:"
  const uncaught = raw.match(/Uncaught Error:\s*(.+)/);
  if (uncaught?.[1]?.trim()) return uncaught[1].trim();
  // Strip Convex wrapper: "[CONVEX ...] [Request ID: ...] Server Error ..."
  const convex = raw.match(/\[CONVEX[^\]]*\]\s*\[Request ID:[^\]]*\]\s*(?:Server Error\s*)?(.*)$/);
  const inner = convex?.[1]?.trim();
  if (inner) return inner;
  // If the raw message is just the Convex prefix with no useful content, use fallback
  if (raw.startsWith("[CONVEX")) return fallback;
  return raw || fallback;
}
