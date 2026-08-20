import { parseYaml } from "@/lib/yaml/parse";
import { failResult, okResult } from "@/lib/transformers/builders";
import type { TransformationResult } from "@/types/transformation";

export function yamlParser(input: string): TransformationResult {
  const parsed = parseYaml(input);
  if (!parsed.ok) {
    return failResult(input, parsed.error, "TEXT", "TEXT");
  }

  return okResult(
    input,
    JSON.stringify(parsed.value, null, 2),
    "YAML_PARSE",
    "JSON",
    "YAML parsed to JSON",
    "TEXT",
  );
}