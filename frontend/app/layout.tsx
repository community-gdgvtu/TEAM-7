import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Silkscreen, VT323 } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const pixel = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pixel",
  display: "swap",
});

const terminal = VT323({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-terminal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MolBhav - the bazaar negotiation game",
  description:
    "One engine that phones India's offline markets in their own languages. Watch your agents haggle live, desk by desk.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${pixel.variable} ${terminal.variable}`}>
      <body>{children}</body>
    </html>
  );
}

