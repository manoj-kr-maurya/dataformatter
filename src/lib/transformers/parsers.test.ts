import { describe, expect, it } from "vitest";
import { jsonParser } from "@/lib/transformers/jsonParser";
import { urlParser } from "@/lib/transformers/urlParser";
import { xmlParser } from "@/lib/transformers/xmlParser";
import { yamlParser } from "@/lib/transformers/yamlParser";
import { parseXml } from "@/lib/xml/parse";
import { parseYaml } from "@/lib/yaml/parse";

describe("urlParser", () => {
  it("breaks a URL into its components", () => {
    const result = urlParser("https://example.com/path/to?q=1&name=Ada#top");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("URL_PARSE");
    expect(result.output).toContain("protocol: https:");
    expect(result.output).toContain("hostname: example.com");
    expect(result.output).toContain("path: /path/to");
    expect(result.output).toContain("hash: #top");
    expect(result.output).toContain("q: 1");
    expect(result.output).toContain("name: Ada");
  });

  it("reports an empty port", () => {
    const result = urlParser("http://localhost:3000/x");
    expect(result.success).toBe(true);
    expect(result.output).toContain("port: 3000");
  });

  it("defaults the port when none is given", () => {
    const result = urlParser("https://example.com");
    expect(result.output).toContain("port: (default)");
  });

  it("fails on invalid URLs", () => {
    const result = urlParser("not a url");
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid URL");
  });

  it("fails on empty input", () => {
    expect(urlParser("").success).toBe(false);
  });
});

describe("jsonParser", () => {
  it("produces a type-annotated tree", () => {
    const result = jsonParser(JSON.stringify({ name: "John", age: 30, tags: ["a", "b"] }));
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_PARSE");
    expect(result.output).toContain("root: object (3 keys)");
    expect(result.output).toContain('name (string): "John"');
    expect(result.output).toContain("age (number): 30");
    expect(result.output).toContain("tags: array (2 items)");
    expect(result.output).toContain("  [0] (string): \"a\"");
    expect(result.output).toContain("  [1] (string): \"b\"");
  });

  it("annotates scalars and nulls", () => {
    const result = jsonParser(JSON.stringify({ ok: true, maybe: null }));
    expect(result.output).toContain("ok (boolean): true");
    expect(result.output).toContain("maybe (null): null");
  });

  it("fails on invalid JSON", () => {
    const result = jsonParser("{nope");
    expect(result.success).toBe(false);
  });
});

describe("xmlParser", () => {
  it("parses nested elements and attributes", () => {
    const input = `<note to="Tove"><from>Jani</from></note>`;
    const result = xmlParser(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("XML_PARSE");
    expect(result.output).toContain('<note to="Tove">');
    expect(result.output).toContain("<from>");
    expect(result.output).toContain('#text: "Jani"');
    expect(result.output).toContain("</note>");
  });

  it("handles self-closing and CDATA", () => {
    const result = xmlParser("<root><br/><![CDATA[a < b]]></root>");
    expect(result.success).toBe(true);
    expect(result.output).toContain("<br/>");
    expect(result.output).toContain('#text: "a < b"');
  });

  it("rejects mismatched tags", () => {
    const result = xmlParser("<a><b></a></b>");
    expect(result.success).toBe(false);
    expect(result.message).toContain("Mismatched tag");
  });

  it("rejects multiple roots", () => {
    const result = xmlParser("<a></a><b></b>");
    expect(result.success).toBe(false);
  });
});

describe("parseXml helper", () => {
  it("returns the root element", () => {
    const parsed = parseXml("<note>Hello</note>");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.root.name).toBe("note");
    expect(parsed.root.text).toContain("Hello");
  });

  it("attributes are unescaped", () => {
    const parsed = parseXml('<a title="x &amp; y"/>');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.root.attributes.title).toBe("x & y");
  });
});

describe("yamlParser", () => {
  it("converts a mapping to JSON", () => {
    const result = yamlParser("name: John\nage: 30\nactive: true\nempty: null");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("YAML_PARSE");
    expect(result.detectedType).toBe("JSON");
    expect(result.output).toBe(
      '{\n  "name": "John",\n  "age": 30,\n  "active": true,\n  "empty": null\n}',
    );
  });

  it("converts sequences and nested blocks to JSON", () => {
    const result = yamlParser("users:\n  - name: A\n    age: 1\n  - name: B\n    age: 2");
    expect(result.success).toBe(true);
    expect(JSON.parse(result.output)).toEqual({
      users: [
        { name: "A", age: 1 },
        { name: "B", age: 2 },
      ],
    });
  });

  it("handles comments and quoted scalars", () => {
    const result = yamlParser('# a note\nkey: "hello world"\nversion: "1.0"  # pinned');
    expect(result.success).toBe(true);
    expect(JSON.parse(result.output)).toEqual({ key: "hello world", version: "1.0" });
  });

  it("parses a top-level array of strings", () => {
    const result = yamlParser("- a\n- b\n- c");
    expect(result.success).toBe(true);
    expect(JSON.parse(result.output)).toEqual(["a", "b", "c"]);
  });

  it("fails on empty input", () => {
    expect(yamlParser("").success).toBe(false);
  });

  it("fails on garbage", () => {
    const result = yamlParser("::not::yaml::");
    expect(result.success).toBe(false);
  });
});

describe("parseYaml helper", () => {
  it("round-trips scalar types", () => {
    const parsed = parseYaml("a: 1\nb: 1.5\nc: true\nd: hello\ne: null");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toEqual({ a: 1, b: 1.5, c: true, d: "hello", e: null });
  });
});