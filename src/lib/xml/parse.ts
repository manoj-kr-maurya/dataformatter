export interface XmlElement {
  name: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  text: string;
  /** True when the tag was written self-closing, e.g. <br/>. */
  selfClosing?: boolean;
}

export type XmlNode = XmlElement | string;

export type XmlParseResult =
  | { ok: true; root: XmlElement }
  | { ok: false; error: string };

/** Split the inside of a tag into a name and attribute pairs. */
function parseTag(content: string): { name: string; attributes: Record<string, string> } | null {
  const nameMatch = /^[^\s/>]+/.exec(content);
  if (!nameMatch) {
    return null;
  }
  const name = nameMatch[0];
  const attributes: Record<string, string> = {};
  const attrRe = /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(content)) !== null) {
    attributes[match[1]] = unescapeXml(match[3] ?? match[4] ?? "");
  }
  return { name, attributes };
}

function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Lightweight well-formedness-checking XML parser. Handles elements,
 * attributes, text, self-closing tags, comments, CDATA, processing
 * instructions and the doctype declaration.
 */
export function parseXml(input: string): XmlParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "There is no XML to parse." };
  }

  const stack: XmlElement[] = [];
  let root: XmlElement | null = null;
  let index = 0;

  const pushText = (text: string) => {
    const current = stack[stack.length - 1];
    if (current) {
      current.text = `${current.text}${text}`;
    }
  };

  while (index < trimmed.length) {
    const lt = trimmed.indexOf("<", index);

    if (lt === -1) {
      pushText(unescapeXml(trimmed.slice(index)));
      break;
    }

    const before = trimmed.slice(index, lt);
    if (before) {
      pushText(unescapeXml(before));
    }

    if (trimmed.startsWith("<!--", lt)) {
      const end = trimmed.indexOf("-->", lt + 4);
      if (end === -1) {
        return { ok: false, error: "Unterminated XML comment." };
      }
      index = end + 3;
      continue;
    }

    if (trimmed.startsWith("<![CDATA[", lt)) {
      const end = trimmed.indexOf("]]>", lt + 9);
      if (end === -1) {
        return { ok: false, error: "Unterminated CDATA section." };
      }
      pushText(trimmed.slice(lt + 9, end));
      index = end + 3;
      continue;
    }

    if (trimmed.startsWith("<?", lt)) {
      const end = trimmed.indexOf("?>", lt + 2);
      if (end === -1) {
        return { ok: false, error: "Unterminated processing instruction." };
      }
      index = end + 2;
      continue;
    }

    if (trimmed.startsWith("<!DOCTYPE", lt) || trimmed.startsWith("<!doctype", lt)) {
      const end = trimmed.indexOf(">", lt + 2);
      if (end === -1) {
        return { ok: false, error: "Unterminated doctype declaration." };
      }
      index = end + 1;
      continue;
    }

    const gt = trimmed.indexOf(">", lt + 1);
    if (gt === -1) {
      return { ok: false, error: "Unterminated tag." };
    }

    const inner = trimmed.slice(lt + 1, gt);
    const isClosing = inner.startsWith("/");

    if (isClosing) {
      const closingName = inner.slice(1).trim();
      const current = stack.pop();
      if (!current) {
        return { ok: false, error: `Unexpected closing tag </${closingName}>.` };
      }
      if (current.name !== closingName) {
        return {
          ok: false,
          error: `Mismatched tag: expected </${current.name}> but found </${closingName}>.`,
        };
      }
      if (stack.length === 0) {
        root = current;
      }
    } else {
      const isSelfClosing = inner.trimEnd().endsWith("/");
      const content = isSelfClosing ? inner.slice(0, inner.lastIndexOf("/")).trim() : inner.trim();
      const parsed = parseTag(content);
      if (!parsed) {
        return { ok: false, error: `Malformed tag <${inner}>.` };
      }

      const element: XmlElement = {
        name: parsed.name,
        attributes: parsed.attributes,
        children: [],
        text: "",
        selfClosing: isSelfClosing || undefined,
      };

      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(element);
      } else if (root) {
        return { ok: false, error: "Multiple root elements." };
      } else {
        root = element;
      }

      if (!isSelfClosing) {
        stack.push(element);
      }
    }

    index = gt + 1;
  }

  if (stack.length > 0) {
    return { ok: false, error: `Unclosed element <${stack[stack.length - 1].name}>.` };
  }
  if (!root) {
    return { ok: false, error: "No root element found." };
  }

  return { ok: true, root };
}
