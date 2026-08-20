type Token =
  | { kind: "lit"; value: string }
  | { kind: "class"; chars: string[] }
  | { kind: "any" }
  | { kind: "alternation"; branches: Token[][] }
  | { kind: "sequence"; parts: Token[] }
  | { kind: "repeat"; token: Token; min: number; max: number };

class RegexError extends Error {}

const DIGITS = "0123456789";
const WORDS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
const SPACE = " \t";
const ALL = `${DIGITS}${WORDS}abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`; 

function charClassValue(name: string): string {
  switch (name) {
    case "d":
      return DIGITS;
    case "w":
      return WORDS;
    case "s":
      return SPACE;
    default:
      throw new RegexError(`Unsupported escape \\${name}.`);
  }
}

/**
 * Parse a regex into a token tree that can generate matching random data.
 * Supports literals, character classes, groups, alternation and quantifiers.
 */
export function parseRegex(pattern: string): Token {
  let index = 0;
  const src = pattern;

  const peek = () => (index < src.length ? src[index] : null);
  const next = () => (index < src.length ? src[index++] : null);

  const parseClassContent = (): string[] => {
    const chars: string[] = [];
    while (index < src.length && peek() !== "]") {
      let from: string | null = null;
      const c = next();
      if (c === "\\") {
        charClassValue(String(next()));
        from = String(next());
      } else if (c === "-") {
        from = "-";
      } else {
        from = c;
      }
      if (peek() === "-") {
        index++;
        let to: string | null = null;
        const c2 = next();
        if (c2 === "\\") {
          to = String(next());
        } else {
          to = c2;
        }
        const fromCode = (from ?? "").charCodeAt(0);
        const toCode = (to ?? "").charCodeAt(0);
        if (from && to && fromCode <= toCode) {
          for (let code = fromCode; code <= toCode; code++) {
            chars.push(String.fromCharCode(code));
          }
        }
      } else if (from) {
        chars.push(from);
      }
    }
    if (peek() === "]") {
      index++;
    }
    return chars;
  };

  const parseRepeats = (base: Token): Token => {
    const c = peek();
    if (c === "*") {
      index++;
      return { kind: "repeat", token: base, min: 0, max: 6 };
    }
    if (c === "+") {
      index++;
      return { kind: "repeat", token: base, min: 1, max: 6 };
    }
    if (c === "?") {
      index++;
      return { kind: "repeat", token: base, min: 0, max: 1 };
    }
    if (c === "{") {
      index++;
      let minText = "";
      while (peek() && /\d/.test(peek() as string)) {
        minText += next();
      }
      if (peek() === ",") {
        index++;
        let maxText = "";
        while (peek() && /\d/.test(peek() as string)) {
          maxText += next();
        }
        if (peek() === "}") {
          index++;
        }
        const min = Math.max(0, Number(minText) || 0);
        const max = Math.max(min, Number(maxText) || min + 6);
        return {
          kind: "repeat",
          token: base,
          min: Math.min(min, 50),
          max: Math.min(max, 50),
        };
      }
      if (peek() === "}") {
        index++;
      }
      const count = Math.min(Number(minText) || 0, 50);
      return { kind: "repeat", token: base, min: count, max: count };
    }
    return base;
  };

  const parseAtom = (): Token => {
    const c = next();
    if (!c) {
      throw new RegexError("Unexpected end of pattern.");
    }
    if (c === "(") {
      const branches: Token[][] = [];
      while (index < src.length && peek() !== ")") {
        branches.push(parseAlternation());
        if (peek() === "|") {
          index++;
          continue;
        }
        if (peek() !== ")") {
          throw new RegexError("Expected ')' to close the group.");
        }
      }
      if (peek() === ")") {
        index++;
      } else {
        throw new RegexError("Unclosed group — expected ')'.");
      }
      const token: Token = { kind: "alternation", branches };
      return token;
    }
    if (c === ")") {
      throw new RegexError("Unexpected ')'.");
    }
    if (c === "[") {
      const negate = peek() === "^";
      if (negate) {
        index++;
      }
      let chars = parseClassContent();
      if (negate) {
        const excluded = new Set(chars);
        chars = [...ALL].filter((ch) => !excluded.has(ch));
      }
      const token: Token = { kind: "class", chars };
      return token;
    }
    if (c === ".") {
      return { kind: "any" as const };
    }
    if (c === "^" || c === "$") {
      return { kind: "lit", value: "" };
    }
    if (c === "\\") {
      const escaped = next();
      if (!escaped) {
        throw new RegexError("Trailing backslash.");
      }
      if (["d", "w", "s"].includes(escaped)) {
        return { kind: "class", chars: [...charClassValue(escaped)] };
      }
      return { kind: "lit", value: escaped };
    }
    return { kind: "lit", value: c };
  };

  const parseAlternation = (): Token[] => {
    const parts: Token[] = [];
    while (index < src.length) {
      const c = peek();
      if (c === "|" || c === ")") {
        break;
      }
      parts.push(parseRepeats(parseAtom()));
    }
    return parts;
  };

  const patternParts = parseAlternation();
  const token: Token =
    patternParts.length === 1
      ? patternParts[0]
      : { kind: "sequence", parts: patternParts };

  return token;
}

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function generate(token: Token): string {
  switch (token.kind) {
    case "lit":
      return token.value;
    case "any":
      return pick([...ALL].filter((ch) => ch !== " "));
    case "class":
      return token.chars.length ? pick(token.chars) : "";
    case "sequence":
      return token.parts.map(generate).join("");
    case "alternation":
      return pick(token.branches).map(generate).join("");
    case "repeat": {
      const times = token.min + Math.floor(Math.random() * (token.max - token.min + 1));
      let out = "";
      for (let i = 0; i < times; i++) {
        out += generate(token.token);
      }
      return out;
    }
  }
}

/** Generate `count` lines of random data matching `pattern`. */
export function randomRegexLines(pattern: string, count: number): string {
  const token = parseRegex(pattern);
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    lines.push(generate(token));
  }
  return lines.join("\n");
}