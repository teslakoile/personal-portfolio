import b from "./blog.module.css";

export function StatusBadge({ status }: { status: "draft" | "published" }) {
  return (
    <span className={`${b.badge} ${status === "draft" ? b.badgeDraft : ""}`}>
      <span className={b.badgeDot} aria-hidden="true" />
      {status === "draft" ? "Draft" : "Published"}
    </span>
  );
}

export function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <ul className={b.chips}>
      {tags.map((t) => <li key={t} className={b.chip}>{t}</li>)}
    </ul>
  );
}
