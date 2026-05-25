import { useAtomValue } from "jotai";
import Link from "next/link";
import { ROUTES } from "@/shared/links";
import { onlineAtom, chartIdleAtom } from "@/store/strategy-view/atoms";

export function Footer({ className, hideStatus }: { className?: string; hideStatus?: boolean }) {
  const year = new Date().getFullYear();
  const isOnline = useAtomValue(onlineAtom);
  const isPaused = useAtomValue(chartIdleAtom);

  const { dotColor, label } = (() => {
    if (!isOnline) return { dotColor: "bg-red-500", label: "No connection" } as const;
    if (isPaused) return { dotColor: "bg-yellow-500", label: "Idle" } as const;
    return { dotColor: "bg-emerald-500", label: "Live" } as const;
  })();

  return (
    <>
      <footer className={`border-t py-2 ${className ?? ''}`}>
        <div
          className="px-4 sm:pl-20 lg:pl-24 lg:pr-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2"
        >
          <span>&copy; {year} Lightterminal.io</span>

          <div className="flex flex-wrap items-center gap-4 sm:justify-end">
            <Link
              href={ROUTES.LITEPAPER}
              className="hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href={ROUTES.TERMS}
              className="hover:text-foreground transition-colors"
            >
              Terms of Use
            </Link>
            <Link
              href={ROUTES.PRIVACY}
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href={ROUTES.LEGAL}
              className="hover:text-foreground transition-colors"
            >
              Legal Disclaimer
            </Link>
          </div>
        </div>
      </footer>

      {/* Always-on status indicator */}
      <div className={`${hideStatus ? 'hidden' : 'hidden sm:flex'} fixed bottom-2 left-4 z-[60] pointer-events-none items-center gap-2`}>
        <span
          className={`inline-block size-2.5 rounded-full ${dotColor}`}
          aria-hidden="true"
        />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </>
  );
}
