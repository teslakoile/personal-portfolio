"use client";

import { useState } from "react";
import s from "./embeds.module.css";

/**
 * Grader playground: eight example test cases for a ticket classifier, each
 * with the expected label, a model output, and a human reviewer's verdict.
 * Pick a grader and every verdict, the pass rate, and the agreement with the
 * reviewer are computed live in the browser (edit distance included), then
 * the matching Promptfoo assertion is printed underneath. The rows are
 * written to show grader failure modes, they are not results from a model.
 */

type Row = { ticket: string; label: string; output: string; reviewer: boolean };

const ROWS: Row[] = [
  { ticket: "My monitor won't turn on.", label: "Hardware", output: "Hardware", reviewer: true },
  { ticket: "I'm in vim and I can't quit.", label: "Software", output: "Software", reviewer: true },
  { ticket: "Best restaurants near the office?", label: "Other", output: "Other", reviewer: true },
  { ticket: "The laptop fan is grinding.", label: "Hardware", output: "hardware", reviewer: true },
  { ticket: "Excel crashes every time I save.", label: "Software", output: "Software.", reviewer: true },
  { ticket: "Two keys on my keyboard stick.", label: "Hardware", output: "This is a Hardware issue.", reviewer: true },
  { ticket: "The VPN client rejects my password.", label: "Software", output: "Hardware or Software", reviewer: false },
  { ticket: "The printer shows a driver error.", label: "Software", output: "Hardware", reviewer: false },
];

const LABELS = ["Hardware", "Software", "Other"];

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length];
}

type GraderId = "equals" | "icontains" | "levenshtein" | "python";

const GRADERS: { id: GraderId; label: string; note: string }[] = [
  {
    id: "equals",
    label: "Exact Match",
    note: "Exact match fails every correct answer that differs only in case or punctuation, so it under-counts. Use it when the output is a constrained value, such as structured output with an enum.",
  },
  {
    id: "icontains",
    label: "Contains",
    note: "Contains passes the formatting variants, but it also passes the hedged answer that names two categories, so it over-counts.",
  },
  {
    id: "levenshtein",
    label: "Edit Distance",
    note: "Edit distance tolerates small differences. Raise the limit to 4 and \"Hardware\" is close enough to \"Software\" to pass, so a wrong label slips through.",
  },
  {
    id: "python",
    label: "Python Check",
    note: "A short Python check that requires exactly one label, and the right one, agrees with the reviewer on every row. The grader encodes the rule the reviewer was applying.",
  },
];

function grade(id: GraderId, row: Row, maxDistance: number): { pass: boolean; detail?: string } {
  switch (id) {
    case "equals":
      return { pass: row.output === row.label };
    case "icontains":
      return { pass: row.output.toLowerCase().includes(row.label.toLowerCase()) };
    case "levenshtein": {
      const d = levenshtein(row.output, row.label);
      return { pass: d <= maxDistance, detail: `distance ${d}` };
    }
    case "python": {
      const found = LABELS.filter((l) => new RegExp(`\\b${l}\\b`, "i").test(row.output));
      return { pass: found.length === 1 && found[0] === row.label, detail: found.length ? `found ${found.join(", ")}` : "found none" };
    }
  }
}

function yamlFor(id: GraderId, maxDistance: number): string {
  const head = "defaultTest:\n  assert:\n";
  switch (id) {
    case "equals":
      return `${head}    - type: equals\n      value: '{{correct_label}}'`;
    case "icontains":
      return `${head}    - type: icontains\n      value: '{{correct_label}}'`;
    case "levenshtein":
      return `${head}    - type: levenshtein\n      value: '{{correct_label}}'\n      threshold: ${maxDistance}`;
    case "python":
      return `${head}    - type: python\n      value: |\n        import re\n        labels = ["Hardware", "Software", "Other"]\n        found = [l for l in labels if re.search(rf"\\b{l}\\b", output, re.I)]\n        return found == [context["vars"]["correct_label"]]`;
  }
}

function Blocks({ marks, label }: { marks: string[]; label: string }) {
  return (
    <div className={s.blocks} role="img" aria-label={label}>
      {marks.map((c, i) => <i key={i} style={{ background: c }} />)}
    </div>
  );
}

export function GraderPlayground({ props }: { props: Record<string, string> }) {
  const start = GRADERS.find((g) => g.id === props.grader)?.id ?? "equals";
  const [grader, setGrader] = useState<GraderId>(start);
  const [maxDistance, setMaxDistance] = useState(2);
  const [gate, setGate] = useState(80);

  const results = ROWS.map((r) => ({ row: r, ...grade(grader, r, maxDistance) }));
  const passed = results.filter((r) => r.pass).length;
  const agree = results.filter((r) => r.pass === r.row.reviewer).length;
  const passRate = Math.round((passed / ROWS.length) * 100);
  const reviewerRate = Math.round((ROWS.filter((r) => r.reviewer).length / ROWS.length) * 100);
  const current = GRADERS.find((g) => g.id === grader)!;

  return (
    <div className={s.shell}>
      <div className={s.bar}>
        <div className={s.pills} role="group" aria-label="Grader">
          {GRADERS.map((g) => (
            <button key={g.id} type="button" className={s.pill} data-active={grader === g.id || undefined} onClick={() => setGrader(g.id)}>
              {g.label}
            </button>
          ))}
        </div>
        <output className={s.readout} aria-live="polite">
          <span className={s.label}>Pass rate</span>
          <span className={s.figure}>{passRate}%</span>
        </output>
      </div>

      <div className={s.cells}>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Expected</th>
                <th>Model Output</th>
                <th>Grader</th>
                <th>Reviewer</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.row.ticket} data-disagree={r.pass !== r.row.reviewer || undefined}>
                  <td>{r.row.ticket}</td>
                  <td className={s.ink}>{r.row.label}</td>
                  <td><code>{r.row.output}</code></td>
                  <td>
                    <span className={s.verdict}><i className={r.pass ? s.pass : s.fail} />{r.pass ? "Pass" : "Fail"}</span>
                    {r.detail ? <div className={s.dist}>{r.detail}</div> : null}
                  </td>
                  <td>
                    <span className={s.verdict}><i className={r.row.reviewer ? s.pass : s.fail} />{r.row.reviewer ? "Correct" : "Wrong"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={s.side}>
          <p className={`${s.sideBlock} ${s.note}`}>{current.note}</p>
          {grader === "levenshtein" ? (
            <div className={s.sideBlock}>
              <label className={s.slider}>
                <span className={s.sliderHead}>
                  <span className={s.label}>Max edit distance</span>
                  <span className={s.value}>{maxDistance}</span>
                </span>
                <input type="range" min={0} max={12} step={1} value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} />
              </label>
            </div>
          ) : null}
          <div className={s.sideBlock}>
            <label className={s.slider}>
              <span className={s.sliderHead}>
                <span className={s.label}>CI gate, minimum pass rate</span>
                <span className={s.value}>{gate}%</span>
              </span>
              <input type="range" min={50} max={100} step={5} value={gate} onChange={(e) => setGate(Number(e.target.value))} />
            </label>
            <p className={s.gate} data-ok={passRate >= gate} style={{ margin: "12px 0 0" }}>
              {passRate >= gate ? "The build passes" : "The build fails"}
              <span className={s.label} style={{ marginLeft: 8 }}>
                {passRate}% against {gate}%
              </span>
            </p>
            <p className={s.caption} style={{ marginTop: 6 }}>
              The reviewer marks {reviewerRate}% correct, so a gate above that should fail.
            </p>
          </div>
        </div>
      </div>

      <div className={s.scoreCells}>
        <div>
          <span className={s.label}>Grader passes</span>
          <span className={s.figure}>{passed} of {ROWS.length}</span>
          <Blocks
            marks={results.map((r) => (r.pass ? "var(--e-b2)" : "var(--e-b1)"))}
            label={`${passed} of ${ROWS.length} test cases pass`}
          />
          <p className={s.caption}>One block is one test case.</p>
        </div>
        <div>
          <span className={s.label}>Agrees with the reviewer</span>
          <span className={s.figure}>{agree} of {ROWS.length}</span>
          <Blocks
            marks={results.map((r) => (r.pass === r.row.reviewer ? "var(--e-b3)" : "var(--e-raw)"))}
            label={`${agree} of ${ROWS.length} verdicts match the reviewer`}
          />
          <p className={s.caption}>Grey blocks are the tinted rows above.</p>
        </div>
        <div>
          <span className={s.label}>Reviewer marks correct</span>
          <span className={s.figure}>{ROWS.filter((r) => r.reviewer).length} of {ROWS.length}</span>
          <Blocks marks={ROWS.map((r) => (r.reviewer ? "var(--e-b2)" : "var(--e-b1)"))} label="Reviewer verdicts" />
          <p className={s.caption}>Example rows written to show each failure mode.</p>
        </div>
      </div>

      <div className={s.yamlHead}>
        <span className={s.label}>The same grader in promptfooconfig.yaml</span>
      </div>
      <pre className={s.yaml}>{yamlFor(grader, maxDistance)}</pre>
    </div>
  );
}
