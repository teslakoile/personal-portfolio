import type { ReactNode } from "react";
import {
  Fraunces,
  Space_Grotesk,
  Inter,
  IBM_Plex_Mono,
  Spline_Sans,
  JetBrains_Mono,
  Geist,
  Geist_Mono,
  Source_Serif_4,
} from "next/font/google";

// All six families verified present in next/font/google. Variable fonts need no
// `weight`; IBM Plex Mono is static so it lists weights. Fraunces uses opsz+wght
// only (SOFT/WONK omitted on purpose — finicky in next/font). Each is exposed as
// a CSS variable; the three direction samples reference whichever they need.
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", axes: ["opsz"], variable: "--font-fraunces" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-space-grotesk" });
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], display: "swap", weight: ["400", "500", "600"], variable: "--font-ibm-plex-mono" });
const splineSans = Spline_Sans({ subsets: ["latin"], display: "swap", variable: "--font-spline-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains-mono" });
const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-geist-mono" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], display: "swap", axes: ["opsz"], variable: "--font-source-serif" });

const fontVars = [
  fraunces.variable,
  spaceGrotesk.variable,
  inter.variable,
  ibmPlexMono.variable,
  splineSans.variable,
  jetbrainsMono.variable,
  geist.variable,
  geistMono.variable,
  sourceSerif.variable,
].join(" ");

export default function SamplesLayout({ children }: { children: ReactNode }) {
  return <div className={`${fontVars} min-h-screen w-full`}>{children}</div>;
}
