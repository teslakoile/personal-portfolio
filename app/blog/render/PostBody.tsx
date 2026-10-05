import type { ReactNode } from "react";
import { getEmbed } from "../embeds/registry";
import { docText, slugify, type DocNode } from "../lib/types";
import { Row } from "../../_brand/kit";
import b from "../blog.module.css";

/**
 * Renders the editor's ProseMirror JSON as plain server HTML, so a post page
 * ships no editor code. Only embeds hydrate on the client. Unknown node
 * types render their children, so an older post never crashes the page.
 */

const SAFE_HREF = /^(https?:|mailto:|\/|#)/i;

function marks(node: DocNode, inner: ReactNode): ReactNode {
  return (node.marks ?? []).reduce<ReactNode>((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{acc}</strong>;
      case "italic":
        return <em>{acc}</em>;
      case "underline":
        return <u>{acc}</u>;
      case "strike":
        return <s>{acc}</s>;
      case "code":
        return <code>{acc}</code>;
      case "link": {
        const href = String(mark.attrs?.href ?? "");
        if (!SAFE_HREF.test(href)) return acc;
        const external = /^https?:/i.test(href);
        return (
          <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, inner);
}

function children(node: DocNode): ReactNode {
  return (node.content ?? []).map((child, i) => <Node key={i} node={child} />);
}

function Node({ node }: { node: DocNode }): ReactNode {
  const a = node.attrs ?? {};
  switch (node.type) {
    case "text":
      return marks(node, node.text);
    case "paragraph":
      return <p>{children(node)}</p>;
    case "heading": {
      const id = slugify(docText(node));
      return Number(a.level) === 3 ? <h3 id={id}>{children(node)}</h3> : <h2 id={id}>{children(node)}</h2>;
    }
    case "bulletList":
      return <ul>{children(node)}</ul>;
    case "orderedList":
      return <ol start={Number(a.start ?? 1)}>{children(node)}</ol>;
    case "listItem":
      return <li>{children(node)}</li>;
    case "blockquote":
      return <blockquote>{children(node)}</blockquote>;
    case "codeBlock":
      return (
        <pre>
          <code>{docText(node)}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr />;
    case "hardBreak":
      return <br />;
    case "image": {
      const src = String(a.src ?? "");
      if (!SAFE_HREF.test(src)) return null;
      const caption = a.title ? String(a.title) : null;
      return (
        <figure className={b.figure}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={String(a.alt ?? "")} loading="lazy" />
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      );
    }
    case "embed": {
      const def = getEmbed(String(a.kind ?? ""));
      if (!def) return null;
      const Comp = def.component;
      const props = { ...def.defaults, ...((a.props as Record<string, string>) ?? {}) };
      const caption = a.caption ? String(a.caption) : null;
      return (
        <figure style={{ margin: 0 }}>
          <Comp props={props} />
          {caption ? <figcaption className={b.embedCaption}>{caption}</figcaption> : null}
        </figure>
      );
    }
    default:
      return <>{children(node)}</>;
  }
}

/**
 * Splits the post into frame rows: each run of text is one reading-column
 * row, each embed gets a full-width row of its own. h2 numbering continues
 * across rows through the counter offset passed to each prose block.
 */
export function PostBody({ doc }: { doc: DocNode }) {
  const groups: { embed: boolean; nodes: DocNode[] }[] = [];
  for (const node of doc.content ?? []) {
    const embed = node.type === "embed";
    const last = groups[groups.length - 1];
    if (!embed && last && !last.embed) last.nodes.push(node);
    else groups.push({ embed, nodes: [node] });
  }
  let h2s = 0;
  return (
    <>
      {groups.map((g, i) => {
        if (g.embed) {
          return (
            <Row key={i} className={b.embedRow}>
              <Node node={g.nodes[0]} />
            </Row>
          );
        }
        const start = h2s;
        h2s += g.nodes.filter((n) => n.type === "heading" && Number(n.attrs?.level) !== 3).length;
        return (
          <Row key={i} className={b.proseRow}>
            <div className={b.prose} style={{ counterReset: `h2 ${start}` }}>
              {g.nodes.map((n, j) => <Node key={j} node={n} />)}
            </div>
          </Row>
        );
      })}
    </>
  );
}
