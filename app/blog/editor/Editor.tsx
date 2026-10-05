"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor as TEditor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import type { EditorView } from "@tiptap/pm/view";
import { Row } from "../../_brand/kit";
import { EmbedNode } from "./EmbedNode";
import { EMBEDS } from "../embeds/registry";
import { deletePost, renamePost, savePost, setStatus, uploadImage } from "../actions";
import type { PostFile, PostStatus } from "../lib/types";
import b from "../blog.module.css";
import e from "./editor.module.css";

/**
 * Medium-style writing surface for one post. Title and subtitle sit above
 * the body; selecting text opens the format bubble; an empty line shows a
 * "+" that opens the block menu, and typing "/" opens it too. Every change
 * autosaves to content/blog/<slug>.json. Publish flips the status in that
 * file; a commit and push carries it to production.
 */

type SlashItem = {
  id: string;
  label: string;
  icon: string;
  hint: string;
  group: "Blocks" | "Interactive";
  run: (editor: TEditor, ctx: { pickImage: () => void }) => void;
};

const ALL_ITEMS: SlashItem[] = [
  { id: "h2", icon: "H2", label: "Heading", hint: "Section title", group: "Blocks", run: (ed) => ed.chain().focus().setNode("heading", { level: 2 }).run() },
  { id: "h3", icon: "H3", label: "Subheading", hint: "Smaller title", group: "Blocks", run: (ed) => ed.chain().focus().setNode("heading", { level: 3 }).run() },
  { id: "ul", icon: "•", label: "Bulleted List", hint: "- then space", group: "Blocks", run: (ed) => ed.chain().focus().toggleBulletList().run() },
  { id: "ol", icon: "1.", label: "Numbered List", hint: "1. then space", group: "Blocks", run: (ed) => ed.chain().focus().toggleOrderedList().run() },
  { id: "quote", icon: "“", label: "Quote", hint: "> then space", group: "Blocks", run: (ed) => ed.chain().focus().toggleBlockquote().run() },
  { id: "code", icon: "{ }", label: "Code Block", hint: "``` then space", group: "Blocks", run: (ed) => ed.chain().focus().toggleCodeBlock().run() },
  { id: "hr", icon: "···", label: "Divider", hint: "--- on a new line", group: "Blocks", run: (ed) => ed.chain().focus().setHorizontalRule().run() },
  { id: "image", icon: "img", label: "Image", hint: "Upload, paste, or drop", group: "Blocks", run: (_ed, ctx) => ctx.pickImage() },
  ...EMBEDS.map<SlashItem>((def) => ({
    id: `embed-${def.kind}`,
    label: def.label,
    icon: def.icon,
    hint: def.description,
    group: "Interactive",
    run: (ed) => ed.chain().focus().insertEmbed(def.kind).run(),
  })),
];

type SaveState = "saved" | "dirty" | "saving" | "error";

function readSlash(editor: TEditor) {
  const { selection } = editor.state;
  if (!selection.empty) return null;
  const { $from } = selection;
  if ($from.parent.type.name !== "paragraph") return null;
  const text = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
  const m = /^\/([^\s/]*)$/.exec(text);
  if (!m) return null;
  return { query: m[1].toLowerCase(), from: $from.start(), to: $from.pos };
}

export function Editor({ slug: initialSlug, initial }: { slug: string; initial: PostFile }) {
  const [slug, setSlug] = useState(initialSlug);
  const [title, setTitle] = useState(initial.title);
  const [dek, setDek] = useState(initial.dek);
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [cover, setCover] = useState<string | null>(initial.cover);
  const [coverAlt, setCoverAlt] = useState(initial.coverAlt ?? "");
  const [coverDrag, setCoverDrag] = useState(false);
  const [status, setStatusState] = useState<PostStatus>(initial.status);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [note, setNote] = useState<string | null>(null);
  const [shipNote, setShipNote] = useState(false);
  const [panel, setPanel] = useState(false);
  const [slugDraft, setSlugDraft] = useState(initialSlug);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  // highlighted row and Escape state, scoped to the "/" at one position so a
  // new slash starts fresh
  const [slashUi, setSlashUi] = useState({ from: -1, index: 0, dismissed: false });

  const slugRef = useRef(slug);
  const metaRef = useRef({ title, dek, tags, cover, coverAlt });
  const coverFileRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const dekRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<TEditor | null>(null);
  const slashRef = useRef<{ open: boolean; from: number; items: SlashItem[]; index: number; choose: (i: number) => void; dismiss: () => void }>({
    open: false,
    from: -1,
    items: [],
    index: 0,
    choose: () => {},
    dismiss: () => {},
  });

  useEffect(() => {
    slugRef.current = slug;
  }, [slug]);
  useEffect(() => {
    metaRef.current = { title, dek, tags, cover, coverAlt };
  }, [title, dek, tags, cover, coverAlt]);

  const enqueue = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const next = queueRef.current.then(fn, fn);
    queueRef.current = next.catch(() => {});
    return next;
  }, []);

  const save = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const editor = editorRef.current;
    if (!editor) return Promise.resolve();
    setSaveState("saving");
    return enqueue(async () => {
      const m = metaRef.current;
      await savePost(slugRef.current, {
        title: m.title.trim(),
        dek: m.dek.trim(),
        tags: m.tags.split(",").map((t) => t.trim()).filter(Boolean),
        cover: m.cover,
        coverAlt: m.coverAlt.trim(),
        doc: JSON.stringify(editor.getJSON()),
      });
    }).then(
      () => setSaveState((s) => (s === "saving" ? "saved" : s)),
      (err: Error) => {
        setSaveState("error");
        setNote(err.message);
      },
    );
  }, [enqueue]);

  const markDirty = useCallback(() => {
    setSaveState("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(), 900);
  }, [save]);

  const upload = useCallback(
    async (file: File) => {
      setNote("Uploading image…");
      const form = new FormData();
      form.append("file", file);
      try {
        const { src } = await enqueue(() => uploadImage(slugRef.current, form));
        setNote(null);
        return src;
      } catch (err) {
        setNote((err as Error).message);
        return null;
      }
    },
    [enqueue],
  );

  const setCoverFrom = async (f: File) => {
    const src = await upload(f);
    if (src) {
      setCover(src);
      markDirty();
    }
  };

  const imageFiles = (list: FileList | null | undefined) =>
    Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({
        placeholder: ({ editor: ed, node }) =>
          node.type.name === "heading"
            ? "Heading"
            : ed.state.doc.childCount <= 1
              ? "Write your story. Press / for headings, images, and interactive blocks."
              : "Press / for blocks",
        showOnlyCurrent: true,
      }),
      Image.configure({ inline: false }),
      EmbedNode,
    ],
    content: initial.doc,
    editorProps: {
      attributes: { class: `${b.prose} ${e.body}` },
      handleKeyDown: (_view: EditorView, event: KeyboardEvent) => {
        const s = slashRef.current;
        if (!s.open || s.items.length === 0) return false;
        if (event.key === "ArrowDown") {
          setSlashUi({ from: s.from, index: (s.index + 1) % s.items.length, dismissed: false });
          return true;
        }
        if (event.key === "ArrowUp") {
          setSlashUi({ from: s.from, index: (s.index - 1 + s.items.length) % s.items.length, dismissed: false });
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          s.choose(s.index);
          return true;
        }
        if (event.key === "Escape") {
          s.dismiss();
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (!files.length) return false;
        void (async () => {
          for (const f of files) {
            const src = await upload(f);
            if (src) editorRef.current?.chain().focus().setImage({ src, alt: "" }).run();
          }
        })();
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = imageFiles(event.dataTransfer?.files);
        if (!files.length) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.doc.content.size;
        void (async () => {
          for (const f of files) {
            const src = await upload(f);
            if (src) editorRef.current?.chain().insertContentAt(pos, { type: "image", attrs: { src, alt: "" } }).run();
          }
        })();
        return true;
      },
    },
    onUpdate: () => markDirty(),
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // ⌘S saves now; leaving with unsaved edits asks first
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key === "s") {
        ev.preventDefault();
        void save();
      }
    };
    const onLeave = (ev: BeforeUnloadEvent) => {
      if (timerRef.current) {
        void save();
        ev.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save]);

  // a fresh post starts with the cursor in the title
  useEffect(() => {
    if (!initial.title) titleRef.current?.focus();
  }, [initial.title]);

  // textareas grow with their text
  const fit = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useLayoutEffect(() => {
    fit(titleRef.current);
    fit(dekRef.current);
  }, [title, dek]);

  // ---------------------------------------------------------------- slash

  const slash = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      const found = ed && ed.isFocused ? readSlash(ed) : null;
      if (!ed || !found) return null;
      // menu position relative to the body wrapper, which scrolls with it
      const c = ed.view.coordsAtPos(found.from);
      const w = ed.view.dom.closest("[data-editor-wrap]")?.getBoundingClientRect();
      return { ...found, top: c.bottom - (w?.top ?? 0) + 8, left: c.left - (w?.left ?? 0) };
    },
  });

  const slashItems = slash
    ? ALL_ITEMS.filter((it) => !slash.query || `${it.label} ${it.id}`.toLowerCase().includes(slash.query))
    : [];
  const ui = slash && slashUi.from === slash.from ? slashUi : { from: slash?.from ?? -1, index: 0, dismissed: false };
  const slashOpen = !!slash && !ui.dismissed && slashItems.length > 0;
  const activeIndex = Math.min(ui.index, Math.max(0, slashItems.length - 1));

  const chooseSlash = (i: number) => {
    const ed = editorRef.current;
    const item = slashItems[i];
    if (!ed || !slash || !item) return;
    ed.chain().focus().deleteRange({ from: slash.from, to: slash.to }).run();
    item.run(ed, { pickImage: () => fileRef.current?.click() });
  };

  useLayoutEffect(() => {
    slashRef.current = {
      open: slashOpen,
      from: ui.from,
      items: slashItems,
      index: activeIndex,
      choose: chooseSlash,
      dismiss: () => setSlashUi({ from: ui.from, index: 0, dismissed: true }),
    };
  });

  // ---------------------------------------------------------- bubble menu
  const marks = useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      ed
        ? {
            bold: ed.isActive("bold"),
            italic: ed.isActive("italic"),
            code: ed.isActive("code"),
            link: ed.isActive("link"),
            href: String(ed.getAttributes("link").href ?? ""),
            h2: ed.isActive("heading", { level: 2 }),
            h3: ed.isActive("heading", { level: 3 }),
            quote: ed.isActive("blockquote"),
          }
        : null,
  });

  const applyLink = () => {
    const ed = editorRef.current;
    if (!ed) return;
    const href = linkValue.trim();
    const chain = ed.chain().focus().extendMarkRange("link");
    if (href) chain.setLink({ href }).run();
    else chain.unsetLink().run();
    setLinkOpen(false);
  };

  // -------------------------------------------------------------- actions
  const replaceImageFolder = (from: string, to: string) => {
    const ed = editorRef.current;
    if (!ed) return;
    const tr = ed.state.tr;
    ed.state.doc.descendants((node, pos) => {
      if (node.type.name === "image" && String(node.attrs.src).includes(`/blog/${from}/`)) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: String(node.attrs.src).replace(`/blog/${from}/`, `/blog/${to}/`) });
      }
    });
    if (tr.docChanged) ed.view.dispatch(tr);
    setCover((c) => c?.replace(`/blog/${from}/`, `/blog/${to}/`) ?? null);
  };

  const rename = async (wanted: string) => {
    await save();
    const from = slugRef.current;
    try {
      const res = await enqueue(() => renamePost(from, wanted));
      if (res.slug !== from) {
        slugRef.current = res.slug;
        setSlug(res.slug);
        replaceImageFolder(from, res.slug);
        window.history.replaceState(null, "", `/blog/${res.slug}/edit`);
      }
      setSlugDraft(res.slug);
      setNote(null);
      return res.slug;
    } catch (err) {
      setNote((err as Error).message);
      setSlugDraft(from);
      return from;
    }
  };

  const publish = async () => {
    if (!title.trim()) {
      setNote("Add a title before you publish.");
      titleRef.current?.focus();
      return;
    }
    await save();
    // a first publish swaps the placeholder slug for one made from the title
    if (slugRef.current.startsWith("untitled")) await rename(title);
    const res = await enqueue(() => setStatus(slugRef.current, "published"));
    setStatusState(res.status);
    setShipNote(true);
  };

  const unpublish = async () => {
    await save();
    const res = await enqueue(() => setStatus(slugRef.current, "draft"));
    setStatusState(res.status);
    setShipNote(true);
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${title || "Untitled"}"? This removes content/blog/${slug}.json and its images.`)) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    await enqueue(() => deletePost(slugRef.current));
  };

  const images: string[] = [];
  editor?.state.doc.descendants((n) => {
    if (n.type.name === "image") images.push(String(n.attrs.src));
  });

  const saveLabel =
    saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Unsaved" : saveState === "error" ? "Save failed" : "Saved";
  const shipCmd = `git add content/blog public/blog && git commit -m "content(blog): ${status === "published" ? "publish" : "unpublish"} ${slug}" && git push`;

  return (
    <>
      <Row className={b.topRow}>
        <div className={`${b.topbar} ${e.barInner}`}>
          <Link href="/blog" className={b.back}>
            <span className={b.backArrow} aria-hidden="true">←</span>
            Writing
          </Link>
          <div className={e.status}>
            <span className={`${b.badge} ${status === "draft" ? b.badgeDraft : ""}`}>
              <span className={b.badgeDot} aria-hidden="true" />
              {status === "draft" ? "Draft" : "Published"}
            </span>
            <span className={e.saveLabel} data-state={saveState}>{saveLabel}</span>
          </div>
          <div className={b.topbarRight}>
            <Link href={`/blog/${slug}`} className={`${b.btn} ${b.btnQuiet}`} target="_blank">Preview</Link>
            <button type="button" className={`${b.btn} ${b.btnQuiet}`} onClick={() => setPanel((p) => !p)} aria-expanded={panel}>
              Settings
            </button>
            {status === "draft" ? (
              <button type="button" className={`${b.btn} ${b.btnAccent}`} onClick={publish}>Publish</button>
            ) : (
              <button type="button" className={b.btn} onClick={unpublish}>Unpublish</button>
            )}
          </div>
        </div>
      </Row>

      {note || shipNote ? (
        <div className={e.notice} role="status">
          {note ? <p>{note}</p> : null}
          {shipNote ? (
            <div className={e.ship}>
              <p>
                {status === "published" ? "Published" : "Moved back to drafts"} in <code>content/blog/{slug}.json</code>.
                Commit and push to update the live site:
              </p>
              <div className={e.shipCmd}>
                <code>{shipCmd}</code>
                <button type="button" className={`${b.btn} ${b.btnQuiet}`} onClick={() => navigator.clipboard.writeText(shipCmd)}>
                  Copy
                </button>
              </div>
            </div>
          ) : null}
          <button type="button" className={e.noticeClose} aria-label="Dismiss" onClick={() => { setNote(null); setShipNote(false); }}>
            ×
          </button>
        </div>
      ) : null}

      {panel ? (
        <aside className={e.panel} aria-label="Post settings">
          <label className={e.field}>
            <span>Slug</span>
            <div className={e.inline}>
              <input value={slugDraft} onChange={(ev) => setSlugDraft(ev.target.value)} spellCheck={false} />
              <button type="button" className={b.btn} disabled={slugDraft === slug} onClick={() => void rename(slugDraft)}>
                Rename
              </button>
            </div>
            <small>kylenaranjo.cv/blog/{slug}</small>
          </label>
          <label className={e.field}>
            <span>Tags</span>
            <input
              value={tags}
              placeholder="Linear Algebra, Explainers"
              onChange={(ev) => {
                setTags(ev.target.value);
                markDirty();
              }}
            />
            <small>Comma separated</small>
          </label>
          <button type="button" className={e.danger} onClick={remove}>Delete Post</button>
        </aside>
      ) : null}

      <Row>
      <main className={e.canvas}>
        <div className={e.column}>
          <textarea
            ref={titleRef}
            className={e.title}
            value={title}
            rows={1}
            placeholder="Title"
            onChange={(ev) => {
              setTitle(ev.target.value);
              markDirty();
            }}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                dekRef.current?.focus();
              }
            }}
          />
          <textarea
            ref={dekRef}
            className={e.dek}
            value={dek}
            rows={1}
            placeholder="Add a subtitle"
            onChange={(ev) => {
              setDek(ev.target.value);
              markDirty();
            }}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || (ev.key === "ArrowDown" && ev.currentTarget.selectionStart === dek.length)) {
                ev.preventDefault();
                editor?.commands.focus("start");
              }
              if (ev.key === "Backspace" && dek === "") {
                ev.preventDefault();
                titleRef.current?.focus();
              }
            }}
          />
          <div
            className={e.cover}
            data-empty={!cover || undefined}
            data-drag={coverDrag || undefined}
            onDragOver={(ev) => {
              if (Array.from(ev.dataTransfer.types).includes("Files")) {
                ev.preventDefault();
                setCoverDrag(true);
              }
            }}
            onDragLeave={() => setCoverDrag(false)}
            onDrop={(ev) => {
              const f = imageFiles(ev.dataTransfer.files)[0];
              setCoverDrag(false);
              if (!f) return;
              ev.preventDefault();
              void setCoverFrom(f);
            }}
          >
            {cover ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt={coverAlt} className={e.coverImg} />
                <div className={e.coverActions}>
                  <button type="button" className={b.btn} onClick={() => coverFileRef.current?.click()}>Replace</button>
                  <button
                    type="button"
                    className={b.btn}
                    onClick={() => {
                      setCover(null);
                      markDirty();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <div className={e.coverEmpty}>
                <p className={e.coverTitle}>Add a Cover Image</p>
                <p className={e.coverHint}>
                  Drop an image here or choose one. It leads the post and shows on the list, the home page, and link
                  previews. 1600 × 900 crops cleanly everywhere.
                </p>
                <div className={e.coverRow}>
                  <button type="button" className={b.btn} onClick={() => coverFileRef.current?.click()}>Choose Image</button>
                  {images.slice(0, 4).map((src) => (
                    <button
                      key={src}
                      type="button"
                      className={e.coverPick}
                      aria-label="Use this image from the post as the cover"
                      onClick={() => {
                        setCover(src);
                        markDirty();
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
                {images.length ? <p className={e.coverHint}>Or use an image already in the post.</p> : null}
              </div>
            )}
          </div>
          {cover ? (
            <input
              className={e.coverAlt}
              value={coverAlt}
              placeholder="Describe the cover for screen readers"
              onChange={(ev) => {
                setCoverAlt(ev.target.value);
                markDirty();
              }}
            />
          ) : null}
          <hr className={e.headRule} />

          <div className={e.wrap} data-editor-wrap>
            {editor ? (
              <>
                <BubbleMenu
                  editor={editor}
                  options={{ placement: "top", offset: 8 }}
                  shouldShow={({ editor: ed, state }) => {
                    const { empty } = state.selection;
                    if (empty || ed.isActive("codeBlock") || ed.isActive("image") || ed.isActive("embed")) {
                      return false;
                    }
                    return ed.isFocused || linkOpen;
                  }}
                >
                  <div className={e.bubble} onMouseDown={(ev) => ev.target instanceof HTMLInputElement || ev.preventDefault()}>
                    {linkOpen ? (
                      <form
                        className={e.linkForm}
                        onSubmit={(ev) => {
                          ev.preventDefault();
                          applyLink();
                        }}
                      >
                        <input
                          autoFocus
                          value={linkValue}
                          placeholder="Paste a link, or leave empty to remove"
                          onChange={(ev) => setLinkValue(ev.target.value)}
                          onKeyDown={(ev) => {
                            if (ev.key === "Escape") {
                              setLinkOpen(false);
                              editor.commands.focus();
                            }
                          }}
                        />
                      </form>
                    ) : (
                      <>
                        <button type="button" data-active={marks?.bold || undefined} aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>
                          <strong>B</strong>
                        </button>
                        <button type="button" data-active={marks?.italic || undefined} aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
                          <em className={e.serifI}>i</em>
                        </button>
                        <button type="button" data-active={marks?.code || undefined} aria-label="Inline code" onClick={() => editor.chain().focus().toggleCode().run()}>
                          <span className={e.monoGlyph}>{"</>"}</span>
                        </button>
                        <button
                          type="button"
                          data-active={marks?.link || undefined}
                          aria-label="Link"
                          onClick={() => {
                            setLinkValue(marks?.href ?? "");
                            setLinkOpen(true);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
                            <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
                          </svg>
                        </button>
                        <span className={e.bubbleSep} aria-hidden="true" />
                        <button type="button" data-active={marks?.h2 || undefined} aria-label="Heading" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                          <span className={e.bigT}>T</span>
                        </button>
                        <button type="button" data-active={marks?.h3 || undefined} aria-label="Subheading" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                          <span className={e.smallT}>T</span>
                        </button>
                        <button type="button" data-active={marks?.quote || undefined} aria-label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                          <span className={e.quoteGlyph}>“</span>
                        </button>
                      </>
                    )}
                  </div>
                </BubbleMenu>

                <FloatingMenu
                  editor={editor}
                  options={{ placement: "left", offset: 16, flip: false }}
                  shouldShow={({ editor: ed, state }) => {
                    const { $from, empty } = state.selection;
                    return (
                      ed.isFocused &&
                      empty &&
                      $from.parent.type.name === "paragraph" &&
                      $from.parent.content.size === 0 &&
                      $from.depth === 1
                    );
                  }}
                >
                  <button
                    type="button"
                    className={e.plus}
                    aria-label="Insert a block"
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => editor.chain().focus().insertContent("/").run()}
                  >
                    +
                  </button>
                </FloatingMenu>
              </>
            ) : null}

            <EditorContent editor={editor} />

            {slashOpen && slash ? (
              <div className={e.slash} style={{ top: slash.top, left: slash.left }} role="listbox" aria-label="Insert a block">
                {(["Blocks", "Interactive"] as const).map((group) => {
                  const inGroup = slashItems.filter((it) => it.group === group);
                  if (!inGroup.length) return null;
                  return (
                    <div key={group} className={e.slashGroup}>
                      <p className={e.slashHead}>{group}</p>
                      {inGroup.map((it) => {
                        const i = slashItems.indexOf(it);
                        return (
                          <button
                            key={it.id}
                            type="button"
                            role="option"
                            aria-selected={i === activeIndex}
                            className={e.slashItem}
                            onMouseEnter={() => setSlashUi({ from: ui.from, index: i, dismissed: false })}
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => chooseSlash(i)}
                          >
                            <span className={e.slashIcon} data-group={it.group} aria-hidden="true">{it.icon}</span>
                            <span className={e.slashText}>
                              <span className={e.slashLabel}>{it.label}</span>
                              <span className={e.slashHint}>{it.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </main>
      </Row>

      <input
        ref={coverFileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(ev) => {
          const f = ev.target.files?.[0];
          ev.target.value = "";
          if (f) void setCoverFrom(f);
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (ev) => {
          const f = ev.target.files?.[0];
          ev.target.value = "";
          if (!f) return;
          const src = await upload(f);
          if (src) editorRef.current?.chain().focus().setImage({ src, alt: "" }).run();
        }}
      />
    </>
  );
}
