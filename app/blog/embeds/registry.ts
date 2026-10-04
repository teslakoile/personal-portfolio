import type { ComponentType } from "react";
import { Determinant } from "./Determinant";
import { GraderPlayground } from "./GraderPlayground";

/**
 * Interactive embeds a post can drop between paragraphs. The editor's "/"
 * menu lists every entry here, the editor renders it live inside the draft,
 * and the post page renders the same component. A post stores only
 * `{ kind, props }`, so an embed's code can change without touching posts.
 *
 * To add one: write a client component taking `{ props }` in this folder,
 * then register it below with its defaults and any settings fields.
 */

export type EmbedProps = { props: Record<string, string> };

export type EmbedField = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

export type EmbedDef = {
  kind: string;
  label: string;
  /** Two or three characters for the "/" menu tile. */
  icon: string;
  description: string;
  component: ComponentType<EmbedProps>;
  defaults: Record<string, string>;
  fields: EmbedField[];
};

export const EMBEDS: EmbedDef[] = [
  {
    kind: "determinant",
    label: "Determinant Explorer",
    icon: "det",
    description: "A 2×2 matrix acting on the plane, with draggable basis vectors",
    component: Determinant,
    defaults: { preset: "shear" },
    fields: [
      {
        key: "preset",
        label: "Starts On",
        options: [
          { value: "shear", label: "Shear" },
          { value: "stretch", label: "Stretch" },
          { value: "flip", label: "Flip" },
          { value: "collapse", label: "Collapse" },
        ],
      },
    ],
  },
  {
    kind: "grader-playground",
    label: "Grader Playground",
    icon: "evl",
    description: "Eight test cases graded live four ways, with reviewer agreement and the Promptfoo assertion",
    component: GraderPlayground,
    defaults: { grader: "equals" },
    fields: [
      {
        key: "grader",
        label: "Starts On",
        options: [
          { value: "equals", label: "Exact Match" },
          { value: "icontains", label: "Contains" },
          { value: "levenshtein", label: "Edit Distance" },
          { value: "python", label: "Python Check" },
        ],
      },
    ],
  },
];

export function getEmbed(kind: string): EmbedDef | undefined {
  return EMBEDS.find((e) => e.kind === kind);
}
