/**
 * Two statements welded into one sentence with ", so" or ", and" ("The picker
 * runs Gemma in the browser, so nothing leaves the page."). Kyle reads the
 * shape as AI-written, and the prompt alone leaves it in about 1 answer in 10,
 * so the route rewrites each sentence that has one before showing it. The eval
 * (scripts/kyllm-eval) uses the same check and rewrite prompt.
 */

/** ", so" (but not "so that"), or ", and" followed by the subject of a new statement. Lists ("a bank, and an education enterprise") don't match. */
export const JOIN =
  /,\s*(?:so (?!that\b)|and (?:it|it's|he|he's|she|they|his|its|your|you|this|these|there|staff|nothing|every|each|i|a (?!few\b)(?:\w+ ){1,2}\w+s\b(?! of)|the \w+ (?:is|are|was|were|uses|runs|has)\b))/i;

export const hasJoin = (sentence: string) => JOIN.test(sentence);

/** Splits off the complete sentences at the start of `buf`; `rest` is the unfinished tail. Each sentence keeps the whitespace after it. */
export function takeSentences(buf: string): { done: string[]; rest: string } {
  const done: string[] = [];
  // up to a ".", "!", or "?" that whitespace follows, so "1.15" and "Next.js" stay inside their sentence
  const re = /[\s\S]*?[.!?]+\s+/gy;
  let m: RegExpExecArray | null, end = 0;
  while ((m = re.exec(buf))) { done.push(m[0]); end = re.lastIndex; }
  return { done, rest: buf.slice(end) };
}

export const REWRITE_MODEL = "claude-haiku-5-5";

export const REWRITE_SYSTEM = `You fix one sentence from a chatbot's answer about a person's work. The sentence joins two complete statements with ", so" or ", and". Rewrite it so it doesn't. Usually split it into two sentences. Use "because", "to", or "which" only when the sentence already says that one statement is the reason for or the purpose of the other. Never merge the two statements into one claim or invent a link between them. "So that" and "and" inside a list are fine.
Keep every fact, name, and number. Keep citation markers like [1] exactly, each before its sentence's final period. Keep an exclamation mark if there is one. Add nothing, and use no em dashes.
Every sentence you get needs this change, even when "so" gives a real reason. Never return it unchanged.
Examples:
"I can only answer questions about Kyle's work, so I can't write a poem." becomes "I can only answer questions about Kyle's work. Writing a poem is outside that."
"Its extension saves items from any shop, and a gift picker suggests ideas [1]." becomes "Its extension saves items from any shop. A gift picker suggests ideas [1]."
"He finished in the Top 5 of the program, and he was a DOST-SEI Merit Scholar [1]." becomes "He finished in the Top 5 of the program. He was also a DOST-SEI Merit Scholar [1]."
"The picker runs Gemma in the browser, so nothing leaves the page!" becomes "The picker runs Gemma in the browser to keep the visitor's data on their device!"
Reply with only the rewritten text.`;

/** The rewrite, or null when it drops a citation, keeps the join, or changes the sentence too much to trust. */
export function acceptRewrite(original: string, rewrite: string): string | null {
  const r = rewrite.trim().replace(/^"|"$/g, "");
  const cites = (s: string) => (s.match(/\[\d+\]/g) ?? []).sort().join();
  if (!r || hasJoin(r) || r.includes("—") || cites(r) !== cites(original)) return null;
  if (r.length > original.length * 1.4 + 20 || r.length < original.length * 0.6) return null;
  // keep the whitespace that followed the sentence, so paragraphs stay intact
  return r + (original.match(/\s*$/)?.[0] ?? " ");
}
