import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    "Kyle Nathan G. Naranjo is a Data Engineer II building data and AI infrastructure, GenAI systems, MLOps workflows, and backend platforms.",
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
      "Data Engineer II at Thinking Machines Data Science focused on data and AI infrastructure, GenAI, MLOps, and backend engineering.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-PH"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
