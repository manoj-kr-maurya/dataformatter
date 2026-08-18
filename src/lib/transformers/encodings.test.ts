import { describe, expect, it } from "vitest";
import { encodeBase32, decodeBase32 } from "@/lib/base32";
import { encodeBase58, decodeBase58 } from "@/lib/base58";
import { encodeHtmlEntities, decodeHtmlEntities } from "@/lib/encoding/html";
import { escapeToUtf8Escapes, unescapeUtf8Escapes, hexToBytes } from "@/lib/encoding/utf8";
import { encodeUrl, decodeUrl } from "@/lib/encoding/url";
import { base32Encoder } from "@/lib/transformers/base32Encoder";
import { base32Decoder } from "@/lib/transformers/base32Decoder";
import { base58Encoder } from "@/lib/transformers/base58Encoder";
import { base58Decoder } from "@/lib/transformers/base58Decoder";
import { urlEncoder } from "@/lib/transformers/urlEncoder";
import { urlDecoder } from "@/lib/transformers/urlDecoder";
import { jsonUrlEncoder } from "@/lib/transformers/jsonUrlEncoder";
import { jsonUrlDecoder } from "@/lib/transformers/jsonUrlDecoder";
import { htmlEncoder } from "@/lib/transformers/htmlEncoder";
import { htmlDecoder } from "@/lib/transformers/htmlDecoder";
import { xmlUrlEncoder } from "@/lib/transformers/xmlUrlEncoder";
import { xmlUrlDecoder } from "@/lib/transformers/xmlUrlDecoder";
import { utf8Converter } from "@/lib/transformers/utf8Converter";
import { utf8Decoder } from "@/lib/transformers/utf8Decoder";
import { hexToUtf8 } from "@/lib/transformers/hexToUtf8";
import { jsonEncoder } from "@/lib/transformers/jsonEncoder";
import { jsonDecoder } from "@/lib/transformers/jsonDecoder";

function okValue(result: { ok: true; value: string } | { ok: false; error: string }): string {
  if (!result.ok) {
    throw new Error(`expected success, got error: ${result.error}`);
  }
  return result.value;
}

async function roundTrip(
  encode: (input: string) => ReturnType<typeof encodeBase32>,
  decode: (input: string) => ReturnType<typeof decodeBase32>,
  input: string,
) {
  const encoded = encode(input);
  expect(encoded.ok).toBe(true);
  if (!encoded.ok) return;
  const decoded = decode(encoded.value);
  expect(decoded.ok).toBe(true);
  if (decoded.ok) expect(decoded.value).toBe(input);
}

describe("base32", () => {
  it("encodes known RFC 4648 vectors", () => {
    expect(okValue(encodeBase32(""))).toBe("");
    expect(okValue(encodeBase32("f"))).toBe("MY======");
    expect(okValue(encodeBase32("fo"))).toBe("MZXQ====");
    expect(okValue(encodeBase32("foo"))).toBe("MZXW6===");
    expect(okValue(encodeBase32("foob"))).toBe("MZXW6YQ=");
    expect(okValue(encodeBase32("fooba"))).toBe("MZXW6YTB");
    expect(okValue(encodeBase32("foobar"))).toBe("MZXW6YTBOI======");
  });

  it("round-trips", async () => {
    await roundTrip(encodeBase32, decodeBase32, "Hello, World! 🌍");
  });

  it("round-trips when dash-separated", async () => {
    const source = "MZXW6YTBOI======";
    const withDash = source.slice(0, 8) + "-" + source.slice(8);
    const decoded = decodeBase32(withDash);
    expect(decoded).toEqual({ ok: true, value: "foobar" });
  });

  it("rejects garbage and partial remainders", () => {
    expect(decodeBase32("0").ok).toBe(false); // 0 not in alphabet
    expect(decodeBase32("MZX").ok).toBe(false); // 3 chars -> only 1 byte available
    expect(decodeBase32("MZXW6Y").ok).toBe(false); // 6 chars -> 3 bytes + 6 leftover bits
    expect(decodeBase32("!!!").ok).toBe(false);
  });
});

describe("base58", () => {
  it("encodes known vectors including leading zeros", () => {
    expect(okValue(encodeBase58(""))).toBe("");
    expect(okValue(encodeBase58("\x00\x01"))).toBe("12");
    expect(okValue(encodeBase58("hello world"))).toBe("StV1DL6CwTryKyV");
  });

  it("round-trips and preserves leading zeros", async () => {
    await roundTrip(encodeBase58, decodeBase58, "Hello, World! 🌍");
    const decoded = decodeBase58("11Q"); // two leading zeros + 0x17
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value).toBe("\x00\x00\x17");
  });

  it("rejects invalid alphabet characters", () => {
    expect(decodeBase58("0").ok).toBe(false);
    expect(decodeBase58("O0Il").ok).toBe(false);
    expect(decodeBase58("hello world").ok).toBe(false); // space not allowed
    expect(decodeBase58("").ok).toBe(false);
  });
});

describe("url encoding", () => {
  it("percent-encodes and decodes", () => {
    expect(okValue(encodeUrl("a b&c=d"))).toBe("a%20b%26c%3Dd");
    expect(decodeUrl("a%20b%26c%3Dd")).toEqual({ ok: true, value: "a b&c=d" });
  });

  it("fails on malformed percent escapes", () => {
    expect(decodeUrl("%zz").ok).toBe(false);
    expect(decodeUrl("%E0%A4%A").ok).toBe(false);
  });

  it("round-trips unicode", async () => {
    await roundTrip(encodeUrl, decodeUrl, "café 👨‍👩‍👧");
  });
});

describe("html encoding", () => {
  it("escapes the five special characters", () => {
    expect(encodeHtmlEntities(`<a href="x" title='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
    );
  });

  it("decodes named, decimal and hex entities", () => {
    expect(decodeHtmlEntities("&lt;a&gt; &amp; &quot;q&quot; &#39;x&#39; &nbsp; &copy; &#x41; &#65;")).toBe(
      "<a> & \"q\" 'x' \u00a0 &copy; A A",
    );
  });

  it("leaves unknown entities untouched", () => {
    expect(decodeHtmlEntities("&madeup;")).toBe("&madeup;");
  });
});

describe("utf8 escapes and hex", () => {
  it("escapes only non-ASCII and round-trips", () => {
    expect(escapeToUtf8Escapes("café")).toBe("caf\\u00e9");
    expect(escapeToUtf8Escapes("😀")).toBe("\\u{1f600}");
    expect(escapeToUtf8Escapes("plain ascii")).toBe("plain ascii");
    expect(unescapeUtf8Escapes(escapeToUtf8Escapes("café 😀"))).toBe("café 😀");
  });

  it("accepts \\uXXXX, \\xNN and \\u{...}", () => {
    expect(unescapeUtf8Escapes("\\u0041 \\x42 \\u0043")).toBe("A B C");
    expect(unescapeUtf8Escapes("\\u{1f600}")).toBe("😀");
  });

  it("hexToBytes handles whitespace and invalid input", () => {
    expect(hexToBytes("48 65 6c 6c 6f")).toEqual({
      ok: true,
      value: Uint8Array.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]),
    });
    expect(hexToBytes("ABC").ok).toBe(false); // odd
    expect(hexToBytes("0g").ok).toBe(false); // not hex
  });
});

describe("base32Encoder / base32Decoder transformers", () => {
  it("encode then decode round-trips through the transformers", () => {
    const text = "Encode me, please 🌍";
    const encoded = base32Encoder(text);
    expect(encoded.success).toBe(true);
    expect(encoded.transformation).toBe("BASE32_ENCODE");
    if (!encoded.success) return;
    const decoded = base32Decoder(encoded.output);
    expect(decoded.success).toBe(true);
    if (decoded.success) expect(decoded.output).toBe(text);
  });

  it("fails on empty and garbage input", () => {
    expect(base32Encoder("  ").success).toBe(false);
    expect(base32Decoder("hello").success).toBe(false);
  });
});

describe("base58Encoder / base58Decoder transformers", () => {
  it("encode then decode round-trips", () => {
    const text = "Encode me, Satoshi 🪙";
    const encoded = base58Encoder(text);
    expect(encoded.success).toBe(true);
    expect(encoded.transformation).toBe("BASE58_ENCODE");
    if (!encoded.success) return;
    const decoded = base58Decoder(encoded.output);
    expect(decoded.success).toBe(true);
    if (decoded.success) expect(decoded.output).toBe(text);
  });

  it("fails on invalid input", () => {
    expect(base58Encoder("  ").success).toBe(false);
    expect(base58Decoder("0lIO").success).toBe(false);
  });
});

describe("url transformer tools", () => {
  it("URL Encode Online encodes", () => {
    const result = urlEncoder("a=b&c");
    expect(result.success).toBe(true);
    expect(result.output).toBe("a%3Db%26c");
  });

  it("URL Decode Online decodes", () => {
    const result = urlDecoder("a%3Db%26c");
    expect(result.success).toBe(true);
    expect(result.output).toBe("a=b&c");
    expect(result.transformation).toBe("URL_DECODE");
  });

  it("URL Decode fails on malformed input", () => {
    expect(urlDecoder("%zz").success).toBe(false);
  });

  it("JSON URL Encode requires valid JSON", () => {
    const ok = jsonUrlEncoder('{"a":1}');
    expect(ok.success).toBe(true);
    expect(ok.output).toBe(encodeURIComponent('{"a":1}'));
    expect(jsonUrlEncoder("not json").success).toBe(false);
  });

  it("JSON URL Decode formats JSON inside the payload", () => {
    const result = jsonUrlDecoder(encodeURIComponent('{"a":1}'));
    expect(result.success).toBe(true);
    expect(result.output).toBe('{\n  "a": 1\n}');
    expect(jsonUrlDecoder(encodeURIComponent("nope")).success).toBe(false);
  });
});

describe("html transformer tools", () => {
  it("HTML Encode escapes and HTML Decode restores", () => {
    const encoded = htmlEncoder(`<b>Tom & "Jerry"</b>`);
    expect(encoded.success).toBe(true);
    expect(encoded.transformation).toBe("HTML_ENCODE");
    if (!encoded.success) return;
    const decoded = htmlDecoder(encoded.output);
    expect(decoded.success).toBe(true);
    if (decoded.success) expect(decoded.output).toBe(`<b>Tom & "Jerry"</b>`);
  });

  it("fails on empty input", () => {
    expect(htmlEncoder("  ").success).toBe(false);
    expect(htmlDecoder("  ").success).toBe(false);
  });
});

describe("xml url transformer tools", () => {
  it("encodes and decodes like URL encoding", () => {
    const encoded = xmlUrlEncoder("https://x.com/?a=1&b=2");
    expect(encoded.success).toBe(true);
    expect(encoded.output).toBe(encodeURIComponent("https://x.com/?a=1&b=2"));
    const decoded = xmlUrlDecoder(encoded.output);
    expect(decoded.success).toBe(true);
    if (decoded.success) expect(decoded.output).toBe("https://x.com/?a=1&b=2");
  });
});

describe("utf8 transformer tools", () => {
  it("UTF8 Converter escapes non-ASCII", () => {
    const result = utf8Converter("café");
    expect(result.success).toBe(true);
    expect(result.output).toBe("caf\\u00e9");
    expect(result.transformation).toBe("UTF8_ENCODE");
  });

  it("UTF8 Decode unescapes", () => {
    const result = utf8Decoder("caf\\u00e9");
    expect(result.success).toBe(true);
    expect(result.output).toBe("café");
  });

  it("Hex to UTF8 decodes hex", () => {
    const result = hexToUtf8("48 69");
    expect(result.success).toBe(true);
    expect(result.output).toBe("Hi");
    expect(hexToUtf8("ff").success).toBe(false); // not valid UTF-8
    expect(hexToUtf8("GG").success).toBe(false);
  });
});

describe("json encode/decode transformer tools", () => {
  it("JSON Encode Online quotes and escapes", () => {
    const result = jsonEncoder('say "hi"');
    expect(result.success).toBe(true);
    expect(result.output).toBe(JSON.stringify('say "hi"'));
    expect(result.transformation).toBe("JSON_ENCODE");
  });

  it("JSON Decode Online unescapes a string literal", () => {
    const result = jsonDecoder(JSON.stringify('say "hi"'));
    expect(result.success).toBe(true);
    expect(result.output).toBe('say "hi"');
    expect(result.transformation).toBe("JSON_DECODE");
  });

  it("JSON Decode fails on invalid JSON", () => {
    expect(jsonDecoder("nope").success).toBe(false);
  });
});