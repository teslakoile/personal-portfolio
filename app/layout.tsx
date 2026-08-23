import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { fontVars } from "./fonts";
import "./globals.css";

// --font-geist-sans/--font-geist-mono feed globals.css (body default).
// fontVars additionally mounts the LOCKED site suite's own variable names
// (--font-geist + --font-geist-mono, see app/fonts.ts) at the root, so EVERY
// route, not just pages that remembered to wrap themselves, resolves the
// quiet design tokens to Geist/Geist Mono instead of the system fallback.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kylenaranjo.cv"),
  title: "Kyle Naranjo | Data Engineer",
  description:
    "Kyle Nathan G. Naranjo is a Data Engineer II building AI agents, data pipelines, cloud infrastructure, MLOps systems, and backend platforms.",
  keywords: [
    "Kyle Naranjo",
    "Data Engineer",
    "MLOps",
    "GenAI",
    "Agentic AI",
    "Data Pipelines",
    "Data Warehousing",
    "Data Modeling",
    "FastAPI",
    "Databricks",
    "Snowflake",
    "Terraform",
    "Kubernetes",
    "OpenAI API",
  ],
  authors: [{ name: "Kyle Nathan G. Naranjo" }],
  creator: "Kyle Nathan G. Naranjo",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kyle Naranjo | Data Engineer",
    description:
      "Data Engineer II at Thinking Machines Data Science focused on AI agents, data pipelines, cloud infrastructure, MLOps, and backend engineering.",
    url: "/",
    siteName: "Kyle Naranjo",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kyle Naranjo | Data Engineer",
    description:
      "Data and AI infrastructure, GenAI systems, MLOps, backend engineering, and cloud delivery across enterprise engagements.",
  },
};

// Warm-paper chrome on mobile browsers, matching the site background.
export const viewport: Viewport = {
  themeColor: "#faf9f7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-PH"
      className={`${geistSans.variable} ${geistMono.variable} ${fontVars} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
