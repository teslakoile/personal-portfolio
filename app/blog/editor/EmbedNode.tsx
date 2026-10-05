"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { getEmbed } from "../embeds/registry";
import b from "../blog.module.css";
import e from "./editor.module.css";

/**
 * Block node holding one interactive embed: `{ kind, props }`. In the editor
 * it renders the live component, so you can play with it while writing; the
 * bar above it (shown on hover or selection) drags the block, edits its
 * settings, and removes it, and the line below takes an optional caption.
 */

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embed: {
      insertEmbed: (kind: string) => ReturnType;
    };
  }
}

function EmbedView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const kind = String(node.attrs.kind);
  const def = getEmbed(kind);
  const props = { ...(def?.defaults ?? {}), ...((node.attrs.props as Record<string, string>) ?? {}) };

  return (
    <NodeViewWrapper className={b.embed} data-selected={selected || undefined}>
      <div className={e.embedFrame} data-selected={selected || undefined}>
        <div className={e.embedBar} contentEditable={false}>
          <span className={e.embedGrip} data-drag-handle aria-label="Drag to move">⠿</span>
          <span className={e.embedName}>{def?.label ?? `Unknown embed "${kind}"`}</span>
          <span className={e.embedSpacer} />
          {def?.fields.map((f) => (
            <label key={f.key} className={e.embedField} data-embed-control>
              <span>{f.label}</span>
              <select
                value={props[f.key] ?? ""}
                onChange={(ev) => updateAttributes({ props: { ...props, [f.key]: ev.target.value } })}
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          ))}
          <button type="button" className={e.embedRemove} onClick={deleteNode} data-embed-control>
            Remove
          </button>
        </div>
        <div data-embed-body contentEditable={false}>
          {def ? <def.component key={JSON.stringify(props)} props={props} /> : null}
        </div>
      </div>
      <input
        className={e.embedCaption}
        data-embed-control
        value={String(node.attrs.caption ?? "")}
        placeholder="Add a caption (optional)"
        onChange={(ev) => updateAttributes({ caption: ev.target.value })}
      />
    </NodeViewWrapper>
  );
}

export const EmbedNode = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      kind: { default: "" },
      props: { default: {} },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-embed": "" })];
  },

  addCommands() {
    return {
      insertEmbed:
        (kind) =>
        ({ commands }) => {
          const def = getEmbed(kind);
          return commands.insertContent({ type: this.name, attrs: { kind, props: { ...(def?.defaults ?? {}) } } });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedView, {
      // let the embed and its settings own their pointer and key events
      stopEvent: ({ event }) => {
        const t = event.target as HTMLElement | null;
        return !!t?.closest?.("[data-embed-body], [data-embed-control]");
      },
    });
  },
});
