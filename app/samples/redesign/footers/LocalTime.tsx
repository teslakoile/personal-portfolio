"use client";

import { useEffect, useState } from "react";

/** Live Philippine time, rendered after mount so server and client agree. */
export function LocalTime({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const text = now
    ? new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(now)
    : "--:--";
  return <time className={className} dateTime={now?.toISOString()} suppressHydrationWarning>{text}</time>;
}
