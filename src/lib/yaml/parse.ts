export type YamlParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

class YamlError extends Error {}

interface YamlLine {
  indent: number;
  text: string;
}

/** Remove a trailing comment, respecting quoted strings. */
function stripComment(raw: string): string {
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (quote) {
      if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "#" && (i === 0 || /\s/.test(raw[i - 1]))) {
      return raw.slice(0, i).trimEnd();
    }
  }
  return raw;
}

function tokenize(input: string): YamlLine[] {
  const lines: YamlLine[] = [];
  input.split("\n").forEach((raw) => {
    if (/^\s*\t/.test(raw)) {
      throw new YamlError("Tabs are not allowed for YAML indentation.");
    }
    if (/^\s*$/.test(raw)) {
      return;
    }
    const clean = stripComment(raw).trimEnd();
    if (!clean.trim() || /^---$/.test(clean.trim()) || /^\.\.\.$/.test(clean.trim())) {
      return;
    }
    const indent = raw.length - raw.trimStart().length;
    lines.push({ indent, text: clean.trim() });
  });
  return lines;
}

function parseKeyScan(text: string): { key: string; rest: string; hasValue: boolean } {
  let quote: '"' | "'" | null = null;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "[" || char === "{") {
      depth++;
    } else if (char === "]" || char === "}") {
      depth--;
    } else if (char === ":" && depth === 0) {
      const key = text.slice(0, i).trim();
      if (!key) {
        throw new YamlError("Empty mapping key in YAML.");
      }
      const rest = text.slice(i + 1).trim();
      return { key, rest, hasValue: rest.length > 0 };
    }
  }
  throw new YamlError(`Expected a mapping entry, got "${text}".`);
}

function parseKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return key;
}

function splitTopLevel(text: string, separator: "," | ":"): string[] {
  const parts: string[] = [];
  let quote: '"' | "'" | null = null;
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "[" || char === "{") {
      depth++;
    } else if (char === "]" || char === "}") {
      depth--;
    } else if (char === separator && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

function parseScalar(text: string): string | number | boolean | null {
  const value = text.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }

  if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  if (/^(null|Null|NULL|~)$/.test(value)) {
    return null;
  }

  if (/^(true|True|TRUE)$/.test(value)) {
    return true;
  }

  if (/^(false|False|FALSE)$/.test(value)) {
    return false;
  }

  if (/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(value)) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }

  return value;
}

/** Parse an inline flow value (plain scalar, [..] or {..}). */
function parseInlineValue(text: string): unknown {
  const value = text.trim();

  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    return splitTopLevel(inner, ",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => parseInlineValue(item));
  }

  if (value.startsWith("{") && value.endsWith("}")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) {
      return {};
    }
    const obj: Record<string, unknown> = {};
    splitTopLevel(inner, ",")
      .map((pair) => pair.trim())
      .filter((pair) => pair.length > 0)
      .forEach((pair) => {
        const colon = topLevelColon(pair);
        if (colon === -1) {
          throw new YamlError(`Malformed flow mapping entry "${pair}".`);
        }
        const key = parseKey(pair.slice(0, colon));
        obj[key] = parseInlineValue(pair.slice(colon + 1));
      });
    return obj;
  }

  return parseScalar(value);
}

function topLevelColon(text: string): number {
  let quote: '"' | "'" | null = null;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "[" || char === "{") {
      depth++;
    } else if (char === "]" || char === "}") {
      depth--;
    } else if (char === ":" && depth === 0) {
      return i;
    }
  }
  return -1;
}

function parseMapping(
  lines: YamlLine[],
  index: number,
  indent: number,
): { value: Record<string, unknown>; next: number } {
  const obj: Record<string, unknown> = {};

  while (index < lines.length && lines[index].indent === indent) {
    const line = lines[index];

    if (line.text.startsWith("-")) {
      break;
    }

    const { key, rest, hasValue } = parseKeyScan(line.text);

    if (hasValue) {
      obj[parseKey(key)] = parseInlineValue(rest);
      index++;
    } else {
      const nextLine = lines[index + 1];
      if (nextLine && nextLine.indent > indent) {
        const child = parseBlock(lines, index + 1, nextLine.indent);
        obj[parseKey(key)] = child.value;
        index = child.next;
      } else {
        obj[parseKey(key)] = null;
        index++;
      }
    }
  }

  return { value: obj, next: index };
}

function parseSequence(
  lines: YamlLine[],
  index: number,
  indent: number,
): { value: unknown[]; next: number } {
  const arr: unknown[] = [];

  while (index < lines.length && lines[index].indent === indent) {
    const line = lines[index];
    if (!line.text.startsWith("-") || (line.text.length > 1 && !line.text.startsWith("- "))) {
      break;
    }

    const rest = line.text.startsWith("- ") ? line.text.slice(2).trim() : "";

    if (!rest) {
      const nextLine = lines[index + 1];
      if (nextLine && nextLine.indent > indent) {
        const child = parseBlock(lines, index + 1, nextLine.indent);
        arr.push(child.value);
        index = child.next;
      } else {
        arr.push(null);
        index++;
      }
      continue;
    }

    const colon = topLevelColon(rest);
    if (colon !== -1) {
      const key = parseKey(rest.slice(0, colon));
      const valueText = rest.slice(colon + 1).trim();
      const item: Record<string, unknown> = {};
      if (valueText) {
        item[key] = parseInlineValue(valueText);
      } else {
        const nextLine = lines[index + 1];
        if (nextLine && nextLine.indent > indent) {
          const child = parseBlock(lines, index + 1, nextLine.indent);
          item[key] = child.value;
          index = child.next;
        } else {
          item[key] = null;
          index++;
        }
        continue;
      }

      const mappingIndent = indent + 2;
      index++;
      while (
        index < lines.length &&
        lines[index].indent === mappingIndent &&
        !lines[index].text.startsWith("-")
      ) {
        const sub = parseKeyScan(lines[index].text);
        const restText = lines[index].text;
        const subRest = restText.slice(restText.indexOf(":") + 1).trim();
        if (subRest) {
          item[parseKey(sub.key)] = parseInlineValue(subRest);
          index++;
        } else {
          const deeper = lines[index + 1];
          if (deeper && deeper.indent > mappingIndent) {
            const child = parseBlock(lines, index + 1, deeper.indent);
            item[parseKey(sub.key)] = child.value;
            index = child.next;
          } else {
            item[parseKey(sub.key)] = null;
            index++;
          }
        }
      }
      arr.push(item);
    } else {
      arr.push(parseInlineValue(rest));
      index++;
    }
  }

  return { value: arr, next: index };
}

function parseBlock(
  lines: YamlLine[],
  index: number,
  indent: number,
): { value: unknown; next: number } {
  const line = lines[index];

  if (line.text.startsWith("-") && (line.text.length === 1 || line.text.startsWith("- "))) {
    return parseSequence(lines, index, indent);
  }

  if (topLevelColon(line.text) !== -1) {
    return parseMapping(lines, index, indent);
  }

  return { value: parseScalar(line.text), next: index + 1 };
}

export function parseYaml(input: string): YamlParseResult {
  let lines: YamlLine[];
  try {
    lines = tokenize(input);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid YAML." };
  }

  if (lines.length === 0) {
    return { ok: false, error: "There is no YAML to parse." };
  }

  try {
    const root = parseBlock(lines, 0, lines[0].indent);
    return { ok: true, value: root.value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid YAML." };
  }
}