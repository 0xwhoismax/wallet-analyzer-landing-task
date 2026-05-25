import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./landing-animations.css";
import { Providers } from "./providers";

const lato = localFont({
  src: [
    { path: "../fonts/lato/Lato-Light.ttf", weight: "300", style: "normal" },
    { path: "../fonts/lato/Lato-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/lato/Lato-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-lato",
  display: "swap",
});

const jost = localFont({
  src: "../fonts/jost/Jost-VariableFont_wght.ttf",
  variable: "--font-jost",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Light Landing Page Task",
  description: "Landing page extraction for the Light wallet analyzer implementation task.",
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${lato.variable} ${jost.variable} ${geistMono.variable} font-sans relative`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
