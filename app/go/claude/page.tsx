import type { Metadata } from "next";
import { Forward } from "./Forward";

// Gmail strips claude:// hrefs from emails, so the job-search digest links
// here and this page hands the browser to the Claude desktop app. Only these
// fixed targets are allowed: nothing from the URL ends up in the deep link.
const FOLDER = "/Users/kyle/Desktop/Coding/job-search";

const PROMPTS: Record<string, string> = {
  linkedin:
    "Run the job search Mac run now: read routines/local.md and follow it.",
  jobsearch:
    "Open the job search. Read CLAUDE.md, then show me what needs me today.",
};

function deepLink(prompt: string): string {
  return `claude://code/new?folder=${FOLDER}&q=${encodeURIComponent(prompt)}`;
}

export const metadata: Metadata = {
  title: "Opening Claude",
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { a } = await searchParams;
  const key = typeof a === "string" ? a : undefined;
  const prompt =
    key && Object.hasOwn(PROMPTS, key) ? PROMPTS[key] : undefined;

  return (
    <main className="flex flex-1 items-center justify-center bg-[#faf9f7] px-4 py-16 text-[#1c1917]">
      <div className="w-full max-w-sm text-center">
        {prompt ? (
          <Forward href={deepLink(prompt)} />
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              Link Not Recognised
            </h1>
            <p className="mt-3 text-sm text-stone-600">
              This link is not recognised.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
