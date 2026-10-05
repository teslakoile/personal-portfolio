import b from "./blog.module.css";

/**
 * A post's cover at thumbnail size. With no cover image it falls back to a
 * typographic tile, the first tag and the title on a ruled surface, so a
 * list never shows an empty cell or a stand-in picture.
 */
export function CoverThumb({ post }: { post: { title: string; tags: string[]; cover: string | null; coverAlt?: string } }) {
  return (
    <div className={b.thumbFrame}>
      {post.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={b.thumbImg} src={post.cover} alt={post.coverAlt ?? ""} loading="lazy" />
      ) : (
        <div className={b.thumbFallback} aria-hidden="true">
          <span className={b.thumbTag}>{post.tags[0] ?? "Writing"}</span>
          <span className={b.thumbTitle}>{post.title || "Untitled"}</span>
        </div>
      )}
    </div>
  );
}
