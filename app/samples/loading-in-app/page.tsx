import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sample } from "../sampleContent";
import { Loading } from "../states/States";
import { ASK_VERBS, PIPELINE_VERBS, SEND_VERBS } from "../states/verbs";
import st from "../states/states.module.css";
import s from "./inApp.module.css";

/**
 * /samples/loading-in-app: where the chosen loading line (chevron, one word,
 * Shimmer Synced) would appear in the real site, each surface mocked with the
 * live component and labeled honestly: does it load anything today, and what
 * would make it load.
 */
export const metadata: Metadata = { title: "Loading in the App | Samples", robots: { index: false, follow: false } };

function Scene({ num, title, today, needs, children }: { num: string; title: string; today: string; needs: string; children: ReactNode }) {
  return (
    <section className={st.row}>
      <div className={st.head}>
        <h2><span>{num}</span>{title}</h2>
      </div>
      <div className={st.cells} style={{ gridTemplateColumns: "1fr 300px" }}>
        <div className={s.mockCell}>{children}</div>
        <dl className={s.facts}>
          <div><dt>Today</dt><dd>{today}</dd></div>
          <div><dt>What makes it load</dt><dd>{needs}</dd></div>
        </dl>
      </div>
    </section>
  );
}

// 40 weeks by 7 days of resting cells, in the shape of the GitHub graph
const GH_WEEKS = 40;

export default function LoadingInAppPage() {
  return (
    <div className={st.root}>
      <main className={st.frame}>
        <header className={st.row}>
          <div className={st.intro}>
            <h1>Loading in <em>the App</em></h1>
            <p>
              Where the loading line would show up on the real site. Each mock runs the chosen loader, words, and
              shimmer. Today nothing on the site waits long enough to need it, so each card says what would.
            </p>
          </div>
        </header>

        <Scene num="01" title="⌘K Ask"
          today="Answers are instant keyword matches from a fixed list, so nothing loads."
          needs="The planned Claude-backed answers. The loader shows from Enter until the first words stream in, using the ⌘K words.">
          <div className={s.scrim}>
            <div className={s.askPanel}>
              <p className={s.askPrompt}>What do you want to ask?</p>
              <div className={s.askInput}>What&apos;s your stack?</div>
              <div className={s.askBody}><Loading verbs={ASK_VERBS} timer /></div>
            </div>
          </div>
        </Scene>

        <Scene num="02" title="KYLLM Chat"
          today="Not built yet. It is the planned chat hero."
          needs="Every reply. The loader sits where the reply will appear and gives way to the streamed text.">
          <div className={s.chat}>
            <div className={s.chatHead}><b>KYLLM</b><span>Answers from Kyle&apos;s CV</span></div>
            <div className={s.chatLog}>
              <p className={s.bubbleUser}>Give me the 30-second version of Kyle.</p>
              <div className={s.bubbleBot}><Loading verbs={ASK_VERBS} timer /></div>
            </div>
            <div className={s.chatInput}>Ask about Kyle&apos;s work…</div>
          </div>
        </Scene>

        <Scene num="03" title="GitHub Section"
          today="The graph is fetched on the server before the page is sent, so visitors never see it load."
          needs="Streaming the section (React Suspense) so the rest of the page shows first while GitHub responds, using the page words.">
          <div className={s.ghCard}>
            <div className={s.ghHead}><b>GitHub</b><span>github.com/{sample.github.user}</span></div>
            <div className={s.ghGrid} aria-hidden="true">
              {Array.from({ length: GH_WEEKS * 7 }, (_, i) => <i key={i} />)}
            </div>
            <div className={s.ghOverlay}><Loading verbs={PIPELINE_VERBS} /></div>
          </div>
        </Scene>

        <Scene num="04" title="Page Navigation"
          today="Every page loads at once; the /projects page is switched off."
          needs="A loading.tsx file on a slower route, such as /projects when it returns. It shows in the content area while the page loads.">
          <div className={s.browser}>
            <div className={s.browserBar}><i /><i /><i /><span>kylenaranjo.cv/projects</span></div>
            <div className={s.browserBody}>
              <aside className={s.skelSide}>{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</aside>
              <div className={s.browserMain}>
                <Loading verbs={PIPELINE_VERBS} />
                <div className={s.skelLines}><i /><i /><i /></div>
              </div>
            </div>
          </div>
        </Scene>

        <Scene num="05" title="Get in Touch"
          today="Get in Touch opens the visitor's email app, so nothing is sent from the site."
          needs="A contact form. The send button holds the loader and the send words until the message is delivered. Its width stays fixed while the words change.">
          <div className={s.form}>
            <div className={s.field}><span>Name</span><div>Ana Reyes</div></div>
            <div className={s.field}><span>Email</span><div>ana@example.com</div></div>
            <div className={s.field}><span>Message</span><div className={s.fieldArea}>Hi Kyle, are you open to a data platform role?</div></div>
            <span className={s.sendBtn} aria-disabled="true"><Loading verbs={SEND_VERBS} /></span>
          </div>
        </Scene>

        <footer className={st.footer}>
          <span>/samples/loading-in-app</span>
          <span>Proposed brand · not live</span>
        </footer>
      </main>
    </div>
  );
}
