"use client";
import * as React from "react";
import Link from "next/link";
import { Book } from "lucide-react";
import { Button } from "./ui/button";
import { ROUTES } from "../shared/links";
import { StrategyIcon } from "../shared/icons/strategy-icon";
import XLogo from "@/shared/icons/logo-x";

// THIS IS A TEMPORARY HEADER FOR SIGNUP AND LANDING PAGE WHILE SITE IS NOT LIVE YET
export function TempHeader() {
  return (
    <header className="flex h-16 items-center px-6 pt-safe relative z-20">
      <div className="flex-1 flex items-center text-white">
        <Link href={"/"} className="flex items-center">
          <StrategyIcon size={32} className="mr-4" />
          <span className="text-xl font-brand">Light</span>
        </Link>
      </div>
      <div className="flex items-center gap-1 text-white">
        <Button asChild variant="ghost" size="icon" className="size-10 rounded-full p-0 text-white/70 hover:text-white hover:bg-white/10">
          <Link href={ROUTES.LITEPAPER} target="_blank" rel="noopener noreferrer">
            <Book className="size-5" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="size-10 rounded-full p-0 text-white/70 hover:text-white hover:bg-white/10">
          <Link href="https://x.com/lightterminal" target="_blank" rel="noopener noreferrer">
            <XLogo className="size-5" />
          </Link>
        </Button>
        {/* <Link href={ROUTES.SIGNUP_BONUS}>
          <Button variant="outline">Sign up as a Creator</Button>
        </Link> */}
        {/* remove the theme toggle on landing cause doesn't look great */}
      </div>
    </header>
  );
}
