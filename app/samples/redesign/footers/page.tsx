import type { Metadata } from "next";
import { BrandRoot, Frame, Row } from "../../../_brand/kit";
import { LocalTime } from "./LocalTime";
import f from "./footers.module.css";

/**
 * Expressive footer directions (round 2). Kyle rejected utility footers (link
 * grids, colophon tables) and moved KYLLM to the hero, so each of these is one
 * idea: a sign-off sentence, a photograph, the local time, or the name itself.
 * Every one keeps a single email link and a quiet bottom line.
 */
export const metadata: Metadata = {
  title: "Footer Options | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const EMAIL = "kyle.naranjo@gmail.com";

/** The one shared utility line: copyright and three text links. */
function Quiet() {
  return (
    <div className={f.quiet}>
      <span>© 2026 Kyle Naranjo</span>
      <nav aria-label="Elsewhere">
        <a href="https://linkedin.com/in/kyle-naranjo">LinkedIn</a>
        <a href="https://github.com/teslakoile">GitHub</a>
        <a href="/Kyle-Naranjo-CV.pdf">CV</a>
      </nav>
    </div>
  );
}

function SignOff() {
  return (
    <>
      <Row>
        <div className={f.signoff}>
          <p className={f.signoffText}>Thanks for reading. <span>If you&apos;re building AI agents, data pipelines, or cloud infrastructure, I&apos;d like to hear about it.</span></p>
          <a className={`${f.mail} ${f.signoffMail}`} href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </div>
      </Row>
      <Quiet />
    </>
  );
}

function Bridge() {
  return (
    <>
      <Row>
        <div className={f.bridge}>
          <div className={f.bridgeText}>
            <h2 className={f.bridgeName}>Kyle Naranjo</h2>
            <p className={f.bridgeLine}>Write to me at <a className={f.mail} href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
          </div>
          <div className={f.bridgeArt} aria-hidden="true">
            <i />
            <span className={f.caption}>Golden Gate Bridge</span>
          </div>
        </div>
      </Row>
      <Quiet />
    </>
  );
}

function Time() {
  return (
    <>
      <Row>
        <div className={f.time}>
          <p className={f.timeLead}>For Kyle in the Philippines, it&apos;s</p>
          <LocalTime className={f.timeBig} />
          <p className={f.timeZone}>Philippine Standard Time, UTC+8</p>
          <a className={`${f.mail} ${f.timeMail}`} href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </div>
      </Row>
      <Quiet />
    </>
  );
}

function HalftoneName() {
  return (
    <>
      <Row>
        <div className={f.htTop}>
          <p className={f.htLead}>Let&apos;s talk: <a className={f.mail} href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
        </div>
        <div className={f.htWord} aria-hidden="true"><span>Kyle Naranjo</span></div>
      </Row>
      <Quiet />
    </>
  );
}

function SignOffTime() {
  return (
    <>
      <Row>
        <div className={f.combo}>
          <p className={f.signoffText}>Thanks for reading. <span>If you&apos;re building AI agents, data pipelines, or cloud infrastructure, I&apos;d like to hear about it.</span></p>
          <div className={f.comboLine}>
            <a className={`${f.mail} ${f.signoffMail}`} style={{ marginTop: 0 }} href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <span>It&apos;s <LocalTime className={f.comboTime} /> in the Philippines</span>
          </div>
        </div>
      </Row>
      <Quiet />
    </>
  );
}

const OPTIONS = [
  { id: "option-a", label: "A · Sign-Off", Footer: SignOff },
  { id: "option-b", label: "B · Bridge", Footer: Bridge },
  { id: "option-c", label: "C · Local Time", Footer: Time },
  { id: "option-d", label: "D · Halftone Name", Footer: HalftoneName },
  { id: "option-e", label: "E · Sign-Off and Time", Footer: SignOffTime },
];

export default function FooterOptions() {
  return (
    <BrandRoot>
      <div id="top" style={{ padding: "40px 24px 80px", display: "grid", gap: 56 }}>
        {OPTIONS.map(({ id, label, Footer }) => (
          <section key={id} id={id} aria-label={label}>
            <p className={f.label}>{label}</p>
            <Frame><footer><Footer /></footer></Frame>
          </section>
        ))}
      </div>
    </BrandRoot>
  );
}
