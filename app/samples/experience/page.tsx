import type { Metadata } from "next";
import { BrandRoot, Frame } from "../../_brand/kit";
import { Cursor } from "../../_brand/Cursor";
import { MotionRoot } from "../../_brand/MotionRoot";
import { ChipFx } from "../../_brand/ChipFx";
import { Experience } from "../../_brand/sections/Experience";

/**
 * The Experience section on its own, for review. ?d=all opens every drawer and
 * ?d=none closes them; the default opens the current role, as on the redesign.
 */
export const metadata: Metadata = {
  title: "Experience | Kyle Naranjo",
  robots: { index: false, follow: false },
};

export default async function ExperienceSample({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  return (
    <BrandRoot>
      <MotionRoot>
        <Cursor />
        <ChipFx />
        <div style={{ padding: "40px 24px 80px" }}>
          <Frame>
            <Experience initial={d === "all" || d === "none" ? d : "first"} />
          </Frame>
        </div>
      </MotionRoot>
    </BrandRoot>
  );
}
