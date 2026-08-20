/**
 * Flags payloads whose text contains obviously sensitive-looking field names.
 *
 * This is a heuristic — it deliberately errs toward warning, and it makes no
 * attempt to be exhaustive. It exists only to remind users that a share link
 * embeds its own data.
 */
const SENSITIVE_KEYS =
  /(authorization|access_token|refresh_token|api[_-]?key|client[_-]?secret|password|secret|private[_-]?key)/i;

/** True when any of the given strings look like they carry secrets. */
export function looksSensitive(...texts: string[]): boolean {
  return texts.some((text) => SENSITIVE_KEYS.test(text));
}