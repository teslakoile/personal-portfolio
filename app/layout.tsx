import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { fontVars } from "./fonts";
import { AnimatedFavicon } from "./_brand/AnimatedFavicon";
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

// One title and description for the search result, the Open Graph card, and
// the Twitter card, so every surface says the same thing.
const siteTitle = "Kyle Naranjo | Data, AI/ML, and Software Engineering";
const siteDescription =
  "Kyle Naranjo has 4+ years of experience in data, AI/ML, and software engineering for enterprises and startups in various industries. Kyle has earned 10 certifications across OpenAI, AWS, Azure, Google Cloud, and Databricks.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kylenaranjo.cv"),
  title: siteTitle,
  description: siteDescription,
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
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "Kyle Naranjo",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
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
      <body className="min-h-full flex flex-col">
        <AnimatedFavicon />
        {children}
      </body>
    </html>
  );
}
