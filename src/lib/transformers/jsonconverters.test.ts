import { describe, expect, it } from "vitest";
import { jsonToCsv } from "@/lib/transformers/jsonToCsv";
import { jsonToExcel } from "@/lib/transformers/jsonToExcel";
import { jsonToHtml } from "@/lib/transformers/jsonToHtml";
import { jsonToJava } from "@/lib/transformers/jsonToJava";
import { jsonToText } from "@/lib/transformers/jsonToText";
import { jsonToTsv } from "@/lib/transformers/jsonToTsv";
import { jsonToXml } from "@/lib/transformers/jsonToXml";
import { jsonToYaml } from "@/lib/transformers/jsonToYaml";
import { csvCell, jsonTable, tsvCell } from "@/lib/transformers/jsonTable";

const sample = JSON.stringify({ name: "John", age: 30, tags: ["a", "b"] });

describe("jsonToXml", () => {
  it("converts an object to a nested XML document", () => {
    const result = jsonToXml(sample);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_TO_XML");
    expect(result.output).toContain("<root>");
    expect(result.output).toContain("<name>John</name>");
    expect(result.output).toContain("<age>30</age>");
    expect(result.output).toContain("<tags>a</tags>");
    expect(result.output).toContain("<tags>b</tags>");
    expect(result.output).toContain("</root>");
  });

  it("escapes XML special characters", () => {
    const result = jsonToXml(JSON.stringify({ note: "a < b & c" }));
    expect(result.output).toContain("<note>a &lt; b &amp; c</note>");
  });

  it("handles empty objects and nulls", () => {
    const result = jsonToXml(JSON.stringify({ empty: {}, maybe: null }));
    expect(result.success).toBe(true);
    expect(result.output).toContain("<empty/>");
    expect(result.output).toContain("<maybe/>");
  });

  it("fails on invalid JSON", () => {
    expect(jsonToXml("nope").success).toBe(false);
  });
});

describe("jsonToYaml", () => {
  it("renders a nested YAML document", () => {
    const result = jsonToYaml(sample);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_TO_YAML");
    expect(result.output).toContain("name: John");
    expect(result.output).toContain("age: 30");
    expect(result.output).toContain("tags:");
    expect(result.output).toContain("  - a");
    expect(result.output).toContain("  - b");
  });

  it("renders arrays of objects with aligned keys", () => {
    const result = jsonToYaml(JSON.stringify({ users: [{ name: "A", age: 1 }, { name: "B" }] }));
    expect(result.output).toContain("- name: A");
    expect(result.output).toContain("  age: 1");
    expect(result.output).toContain("- name: B");
  });

  it("quotes strings that would parse as numbers or booleans", () => {
    const result = jsonToYaml(JSON.stringify({ yes: "yes", version: "1.0", empty: "" }));
    expect(result.output).toContain('yes: "yes"');
    expect(result.output).toContain('version: "1.0"');
    expect(result.output).toContain("empty: \"\"");
  });

  it("fails on invalid JSON", () => {
    expect(jsonToYaml("not json").success).toBe(false);
  });
});

describe("jsonToText", () => {
  it("renders readable key/value plain text", () => {
    const result = jsonToText(sample);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_TO_TEXT");
    expect(result.output).toContain("name: John");
    expect(result.output).toContain("age: 30");
    expect(result.output).toContain("tags:");
    expect(result.output).toContain("- a");
  });
});

describe("jsonToJava", () => {
  const result = jsonToJava(sample);

  it("generates a Java class with fields and accessors", () => {
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_TO_JAVA");
    expect(result.output).toContain("public class Root {");
    expect(result.output).toContain("private String name;");
    expect(result.output).toContain("public String getName()");
    expect(result.output).toContain("public void setName(String name)");
  });

  it("generates nested classes for nested objects and lists", () => {
    const nested = jsonToJava(JSON.stringify({ users: [{ name: "A" }] }));
    expect(nested.success).toBe(true);
    expect(nested.output).toContain("List<User>");
    expect(nested.output).toContain("public static class User {");
  });

  it("fails when the root is not an object", () => {
    expect(jsonToJava("[1,2]").success).toBe(false);
  });
});

describe("jsonToCsv", () => {
  it("flattens an array of objects into CSV", () => {
    const result = jsonToCsv(
      JSON.stringify([
        { name: "John", age: 30 },
        { name: "Ada", age: 36 },
      ]),
    );
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_TO_CSV");
    expect(result.output).toBe("name,age\nJohn,30\nAda,36");
  });

  it("quotes cells containing commas or quotes", () => {
    const result = jsonToCsv(JSON.stringify([{ name: "a, b" }]));
    expect(result.output).toBe('name\n"a, b"');
  });

  it("fails when the root is not an array of objects", () => {
    const result = jsonToCsv('{"a":1}');
    expect(result.success).toBe(false);
    expect(result.message).toContain("array");
  });
});

describe("jsonToTsv", () => {
  it("flattens an array of objects into TSV", () => {
    const result = jsonToTsv(
      JSON.stringify([
        { name: "John", age: 30 },
        { name: "Ada", age: 36 },
      ]),
    );
    expect(result.success).toBe(true);
    expect(result.output).toBe("name\tage\nJohn\t30\nAda\t36");
  });
});

describe("jsonToExcel", () => {
  it("renders an Excel-openable HTML table", () => {
    const result = jsonToExcel(
      JSON.stringify([
        { name: "John", age: 30 },
        { name: "Ada", age: 36 },
      ]),
    );
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_TO_EXCEL");
    expect(result.output).toContain("<table");
    expect(result.output).toContain("<th>name</th>");
    expect(result.output).toContain("<td>John</td>");
    expect(result.output).toContain("<td>30</td>");
  });
});

describe("jsonToHtml", () => {
  it("renders a nested HTML list", () => {
    const result = jsonToHtml(sample);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_TO_HTML");
    expect(result.output).toBe(
      "<ul><li><strong>name</strong>: John</li><li><strong>age</strong>: 30</li><li><strong>tags</strong><ul><li>a</li><li>b</li></ul></li></ul>",
    );
  });

  it("escapes HTML in values", () => {
    const result = jsonToHtml(JSON.stringify({ note: "a < b & c" }));
    expect(result.output).toContain(": a &lt; b &amp; c</li>");
  });
});

describe("jsonTable helper", () => {
  it("collects a stable column order across rows", () => {
    const table = jsonTable([
      { b: 1, a: 2 },
      { c: 3, b: 4 },
    ]);
    expect(table.ok).toBe(true);
    if (!table.ok) return;
    expect(table.columns).toEqual(["b", "a", "c"]);
  });

  it("stringifies nested cells as JSON", () => {
    const table = jsonTable([{ meta: { x: 1 }, list: [1, 2] }]);
    expect(table.ok).toBe(true);
    if (!table.ok) return;
    expect(table.rows[0]).toEqual(['{"x":1}', "[1,2]"]);
  });

  it("errors on non-array input", () => {
    expect(jsonTable({ a: 1 }).ok).toBe(false);
  });
});

describe("csvCell / tsvCell", () => {
  it("leaves plain cells untouched", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(tsvCell("hello")).toBe("hello");
  });

  it("quotes only when needed", () => {
    expect(csvCell("a, b")).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(tsvCell("a\tb")).toBe('"a\tb"');
  });
});