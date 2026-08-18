import type { XmlElement, XmlNode } from "@/lib/xml/parse";

function attributesText(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");
}

function renderNode(node: XmlNode, pad: string): string[] {
  if (typeof node === "string") {
    return [];
  }

  const lines: string[] = [];
  const attrs = attributesText(node.attributes);

  if (node.selfClosing) {
    lines.push(`${pad}<${node.name}${attrs ? ` ${attrs}` : ""}/>`);
    return lines;
  }

  lines.push(`${pad}<${node.name}${attrs ? ` ${attrs}` : ""}>`);

  const text = node.text.trim();
  if (text) {
    lines.push(`${pad}  #text: "${text}"`);
  }

  node.children.forEach((child) => lines.push(...renderNode(child, `${pad}  `)));
  lines.push(`${pad}</${node.name}>`);
  return lines;
}

export function formatXml(root: XmlElement): string {
  return renderNode(root, "").join("\n");
}
