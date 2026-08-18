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
import { QuietResume } from "./samples/quiet/QuietResume";

// The redesign ("Quiet Blueprint") is the landing page. It reuses the same font
// set the /samples layout exposes so it renders identically at the root. Only
// the swiss (Geist) family is actually painted at runtime under variant="swiss";
// the other families stay defined-but-unfetched (a browser downloads a face only
// when rendered text references it), so this costs nothing extra on the homepage.
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

/**
 * Landing page — the "Quiet Blueprint" redesign (previously previewed at
 * /samples/home) composed with Kyle's section picks: photo hero (V4), about
 * (V3), timeline experience (V1), descriptor skills (V3), writing (V1),
 * certifications, and inline recognition (V2), plus the Community & Speaking
 * and Education finals. The prior text-dense homepage lives on at /classic.
 */
export default function Home() {
  return (
    <div className={`${fontVars} min-h-screen w-full`}>
      <QuietResume
        variant="swiss"
        picks={{ hero: 4, about: 3, experience: 1, skills: 3, writing: 1, certifications: 1, recognition: 2 }}
      />
    </div>
  );
}
