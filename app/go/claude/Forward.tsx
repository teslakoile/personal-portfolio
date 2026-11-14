"use client";

import { useEffect } from "react";

export function Forward({ href }: { href: string }) {
  useEffect(() => {
    window.location.href = href;
  }, [href]);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Opening Claude</h1>
      <p className="mt-3 text-sm text-stone-600">
        If nothing happens, click the button.
      </p>
      <a
        href={href}
        className="mt-6 inline-block rounded-full bg-[#f5482d] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#c9381f]"
      >
        Open Claude
      </a>
    </>
  );
}
