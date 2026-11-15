/** shadcn's `cn` without clsx and tailwind-merge: joins strings and the keys of truthy object entries. */
type ClassValue = string | false | null | undefined | Record<string, boolean | undefined>;
export const cn = (...c: ClassValue[]) =>
  c.flatMap((v) => (!v ? [] : typeof v === "string" ? [v] : Object.keys(v).filter((k) => v[k]))).join(" ");
