import { describe, expect, it } from "vitest";
import { encodeBase64 } from "@/lib/base64/encode";
import { imageToBase64 } from "@/lib/transformers/imageToBase64";
import { base64ToImage } from "@/lib/transformers/base64ToImage";
import { pngToBase64 } from "@/lib/transformers/pngToBase64";
import { jpgToBase64 } from "@/lib/transformers/jpgToBase64";
import { xmlToBase64 } from "@/lib/transformers/xmlToBase64";
import { base64ToXml } from "@/lib/transformers/base64ToXml";
import { yamlToBase64 } from "@/lib/transformers/yamlToBase64";
import { base64ToYaml } from "@/lib/transformers/base64ToYaml";
import { csvToBase64 } from "@/lib/transformers/csvToBase64";
import { base64ToCsv } from "@/lib/transformers/base64ToCsv";
import { tsvToBase64 } from "@/lib/transformers/tsvToBase64";
import { base64ToTsv } from "@/lib/transformers/base64ToTsv";
import { binaryToBase64 } from "@/lib/transformers/binaryToBase64";
import { base64ToBinary } from "@/lib/transformers/base64ToBinary";
import { hexToBase64 } from "@/lib/transformers/hexToBase64";
import { base64ToHex } from "@/lib/transformers/base64ToHex";
import { octalToBase64 } from "@/lib/transformers/octalToBase64";

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const JPG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==";

describe("imageToBase64", () => {
  it("extracts the payload from a PNG data URI", () => {
    const result = imageToBase64(`data:image/png;base64,${PNG_BASE64}`);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("IMAGE_TO_BASE64");
    expect(result.output).toBe(PNG_BASE64);
  });

  it("returns raw Base64 unchanged", () => {
    const result = imageToBase64(PNG_BASE64);
    expect(result.success).toBe(true);
    expect(result.output).toBe(PNG_BASE64);
  });

  it("fails on plain text that is not an image", () => {
    const encoded = encodeBase64("just text");
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    const result = imageToBase64(encoded.value);
    expect(result.success).toBe(false);
    expect(result.message).toContain("PNG or JPG");
  });

  it("fails on empty input", () => {
    expect(imageToBase64("  ").success).toBe(false);
  });
});

describe("base64ToImage", () => {
  it("produces a PNG data URI", () => {
    const result = base64ToImage(PNG_BASE64);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("BASE64_TO_IMAGE");
    expect(result.output).toBe(`data:image/png;base64,${PNG_BASE64}`);
  });

  it("detects a JPG and preserves its mime type", () => {
    const result = base64ToImage(JPG_BASE64);
    expect(result.success).toBe(true);
    expect(result.output).toBe(`data:image/jpeg;base64,${JPG_BASE64}`);
  });

  it("preserves an existing mime type on a data URI", () => {
    const result = base64ToImage(`data:image/gif;base64,${PNG_BASE64}`);
    expect(result.success).toBe(true);
    expect(result.output).toBe(`data:image/gif;base64,${PNG_BASE64}`);
  });
});

describe("pngToBase64", () => {
  it("converts a PNG data URI to Base64", () => {
    const result = pngToBase64(`data:image/png;base64,${PNG_BASE64}`);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("PNG_TO_BASE64");
    expect(result.output).toBe(PNG_BASE64);
  });

  it("rejects JPG data", () => {
    const result = pngToBase64(JPG_BASE64);
    expect(result.success).toBe(false);
    expect(result.message).toContain("PNG");
  });
});

describe("jpgToBase64", () => {
  it("converts a JPG data URI to Base64", () => {
    const result = jpgToBase64(`data:image/jpeg;base64,${JPG_BASE64}`);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JPG_TO_BASE64");
    expect(result.output).toBe(JPG_BASE64);
  });

  it("rejects PNG data", () => {
    const result = jpgToBase64(PNG_BASE64);
    expect(result.success).toBe(false);
    expect(result.message).toContain("JPG");
  });
});

describe("xml <-> Base64", () => {
  it("round-trips XML", () => {
    const xml = "<note><to>Tove</to><from>Jani</from></note>";
    const encoded = xmlToBase64(xml);
    expect(encoded.success).toBe(true);
    expect(encoded.transformation).toBe("XML_TO_BASE64");
    const decoded = base64ToXml(encoded.output);
    expect(decoded.success).toBe(true);
    expect(decoded.output).toBe(xml);
  });

  it("rejects non-XML input", () => {
    const result = xmlToBase64("just some text");
    expect(result.success).toBe(false);
  });

  it("rejects Base64 that decodes to non-XML", () => {
    const encoded = encodeBase64("hello world");
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    const result = base64ToXml(encoded.value);
    expect(result.success).toBe(false);
  });
});

describe("yaml <-> Base64", () => {
  it("round-trips YAML", () => {
    const yaml = "name: John\nage: 30";
    const encoded = yamlToBase64(yaml);
    expect(encoded.success).toBe(true);
    expect(encoded.transformation).toBe("YAML_TO_BASE64");
    const decoded = base64ToYaml(encoded.output);
    expect(decoded.success).toBe(true);
    expect(decoded.output).toBe(yaml);
  });

  it("fails on empty YAML", () => {
    expect(yamlToBase64("   ").success).toBe(false);
  });
});

describe("csv <-> Base64", () => {
  it("round-trips CSV", () => {
    const csv = "name,age\nJohn,30";
    const encoded = csvToBase64(csv);
    expect(encoded.success).toBe(true);
    expect(encoded.transformation).toBe("CSV_TO_BASE64");
    const decoded = base64ToCsv(encoded.output);
    expect(decoded.success).toBe(true);
    expect(decoded.output).toBe(csv);
  });

  it("rejects a single unpasted token", () => {
    const result = csvToBase64("justonetoken");
    expect(result.success).toBe(false);
    expect(result.message).toContain("comma");
  });
});

describe("tsv <-> Base64", () => {
  it("round-trips TSV", () => {
    const tsv = "name\tage\nJohn\t30";
    const encoded = tsvToBase64(tsv);
    expect(encoded.success).toBe(true);
    expect(encoded.transformation).toBe("TSV_TO_BASE64");
    const decoded = base64ToTsv(encoded.output);
    expect(decoded.success).toBe(true);
    expect(decoded.output).toBe(tsv);
  });

  it("rejects a single unpasted token", () => {
    const result = tsvToBase64("justonetoken");
    expect(result.success).toBe(false);
    expect(result.message).toContain("tab");
  });
});

describe("binary <-> Base64", () => {
  it("round-trips binary", () => {
    const encoded = binaryToBase64("0100100001101001");
    expect(encoded.success).toBe(true);
    expect(encoded.transformation).toBe("BINARY_TO_BASE64");
    expect(encoded.output).toBe("SGk=");
    const decoded = base64ToBinary(encoded.output);
    expect(decoded.success).toBe(true);
    expect(decoded.output).toBe("0100100001101001");
  });

  it("rejects bits not aligned to bytes", () => {
    expect(binaryToBase64("0101").success).toBe(false);
  });
});

describe("hex <-> Base64", () => {
  it("round-trips hex", () => {
    const encoded = hexToBase64("48656c6c6f");
    expect(encoded.success).toBe(true);
    expect(encoded.transformation).toBe("HEX_TO_BASE64");
    expect(encoded.output).toBe("SGVsbG8=");
    const decoded = base64ToHex(encoded.output);
    expect(decoded.success).toBe(true);
    expect(decoded.output).toBe("48656c6c6f");
  });

  it("rejects odd-length hex", () => {
    expect(hexToBase64("abc").success).toBe(false);
  });
});

describe("octalToBase64", () => {
  it("converts octal bytes", () => {
    const result = octalToBase64("110 151");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("OCTAL_TO_BASE64");
    expect(result.output).toBe("SGk=");
  });

  it("rejects invalid octal", () => {
    expect(octalToBase64("400").success).toBe(false);
  });
});