import type { Metadata } from "next";
import { BrandRoot } from "../../_brand/kit";
import { ChipFx } from "../../_brand/ChipFx";
import { LINK_OPTS, OptionRow, TAG_OPTS } from "./ProjectCardOptions";
import o from "./options.module.css";

/** /samples/project-cards: options for the project cards' links and tags. */
export const metadata: Metadata = {
  title: "Project Card Options | Kyle Naranjo",
  robots: { index: false, follow: false },
};

export default function ProjectCardOptions() {
  return (
    <BrandRoot>
      <ChipFx />
      <main className={o.page}>
        <h1>Project Card Options</h1>
        <p>Website links and tag chips, on real cards. Each link option keeps the current tags; each tag option keeps the current links.</p>
        <h2>Website Links</h2>
        {LINK_OPTS.map(([id, name, note]) => <OptionRow key={id} id={id} name={name} note={note} link={id} />)}
        <h2>Tag Chips</h2>
        {TAG_OPTS.map(([id, name, note]) => <OptionRow key={id} id={id} name={name} note={note} tag={id} />)}
      </main>
    </BrandRoot>
  );
}
