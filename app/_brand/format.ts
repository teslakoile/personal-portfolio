/**
 * A date range written the redesign's way: "2013 - 2019" and "Aug 2024 -
 * Present", not "to". Only a year or month-year before " to " counts, so a
 * count in prose ("30 to 50 bed") is left alone. sampleContent.ts keeps its
 * "to" wording for the landing page.
 */
export function range(s: string): string {
  return s.replace(/\b((?:[A-Z][a-z]{2} )?\d{4}) to /g, "$1 - ");
}

/**
 * A list item or note without its closing period ("Graduated with High
 * Honors", not "Graduated with High Honors."). Only one trailing period is
 * dropped, so a sentence in the middle of the text keeps its own.
 */
export function bare(s: string): string {
  return s.replace(/(?<!\.)\.$/, "");
}
