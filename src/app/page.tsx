"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LightBeamCanvas } from "@/components/LightBeamCanvas";
import { TempHeader } from "@/components/temp-header";
import { usePrivy } from "@privy-io/react-auth";
import { LogoSolana } from "@/shared/icons/logo-solana";
import { PrivyLogo } from "@/shared/icons/logo-privy";
import { DFlowLogo } from "@/shared/icons/logo-dflow";
import { HeliusLogo } from "@/shared/icons/logo-helius";
import { ConvexLogo } from "@/shared/icons/logo-convex";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { ready, authenticated, login } = usePrivy();

  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const [gradientPos, setGradientPos] = useState(50);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = subtitleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setGradientPos(Math.max(0, Math.min(100, x)));
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const handleEnterBeta = () => {
    if (!authenticated) login();
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--background', '#010204');
    return () => { document.documentElement.style.removeProperty('--background'); };
  }, []);

  if (!ready) return null;

  return (
    <div className="min-h-dvh flex flex-col bg-[#010204] relative">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <LightBeamCanvas />
      </div>

      {/* Header */}
      <div className="relative z-10 shrink-0">
        <TempHeader />
      </div>

      {/* Main content - centered */}
      <div className="relative z-10 flex-1 flex items-center pl-12 md:pl-24 lg:pl-32 pr-6">
        <div className="flex flex-col items-start gap-6">
          <h1
            className="text-7xl md:text-9xl font-brand select-none text-white"
            style={{
              textShadow: "0 0 80px rgba(100, 140, 255, 0.4), 0 0 160px rgba(80, 100, 220, 0.2)",
            }}
          >
            Light
          </h1>
          <p
            ref={subtitleRef}
            className="text-2xl md:text-3xl select-none font-medium tracking-wide"
            style={{
              background: "linear-gradient(90deg, rgba(150,160,230,0.35) 0%, rgba(180,190,255,0.5) 15%, rgba(255,255,255,1) 40%, rgba(255,255,255,1) 60%, rgba(180,190,255,0.5) 85%, rgba(150,160,230,0.35) 100%)",
              backgroundSize: "300% 100%",
              backgroundPosition: `${100 - gradientPos}% 0%`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            The trades you wish you saw sooner
          </p>

          <Button
            onClick={handleEnterBeta}
            className="mt-6 h-14 px-10 text-lg font-semibold tracking-wide bg-white text-black hover:-translate-y-1 active:translate-y-0"
            style={{
              boxShadow:
                "0 0 15px rgba(255,255,255,0.4), 0 0 50px rgba(150,180,255,0.25), 0 0 100px rgba(100,120,255,0.15)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(255,255,255,0.6), 0 0 60px rgba(150,180,255,0.4), 0 0 120px rgba(100,120,255,0.25), 0 0 200px rgba(80,100,240,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 15px rgba(255,255,255,0.4), 0 0 50px rgba(150,180,255,0.25), 0 0 100px rgba(100,120,255,0.15)";
            }}
          >
            START TRADING
          </Button>
        </div>
      </div>

      {/* Powered by */}
      <div className="relative z-10 shrink-0 pl-12 md:pl-24 lg:pl-32 pr-6 mb-4">
        <div className="flex flex-col items-start gap-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
          <span className="text-sm uppercase tracking-widest text-white/50 select-none">
            Powered by
          </span>
          <div className="flex items-center gap-8">
            <LogoSolana className="h-8 md:h-10 text-white/70" style={{ filter: "none" }} />
            <DFlowLogo className="h-8 md:h-10 text-white/70" />
            <HeliusLogo className="h-8 md:h-10 text-white/70" />
            <PrivyLogo className="h-8 md:h-10 text-white/70" style={{ filter: "none" }} />
            <ConvexLogo className="h-8 md:h-10 text-white/70" />
          </div>
        </div>
      </div>

      {/* Footer — force white text since landing page is always dark */}
      <div className="relative z-10 shrink-0 [&_*]:!text-white/50 [&_a:hover]:!text-white/80">
        <Footer className="border-none bg-transparent !py-1" hideStatus />
      </div>

      {/* Invisible spacer — makes page slightly taller than viewport so Safari
          paints content into safe areas (same behavior as genesis page) */}
      <div className="shrink-0" aria-hidden style={{ height: 1 }} />
    </div>
  );
}
