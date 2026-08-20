import { formatXml } from "@/lib/xml/format";
import { parseXml } from "@/lib/xml/parse";
import { failResult, okResult } from "@/lib/transformers/builders";
import type { TransformationResult } from "@/types/transformation";

export function xmlParser(input: string): TransformationResult {
  const parsed = parseXml(input);
  if (!parsed.ok) {
    return failResult(input, parsed.error, "TEXT", "TEXT");
  }

  return okResult(
    input,
    formatXml(parsed.root),
    "XML_PARSE",
    "TEXT",
    "XML parsed into an element tree",
    "TEXT",
  );
}