import { describe, expect, it } from "vitest";
import { extractEmbeddedJwt, parseJwt } from "@/lib/jwt/decode";
import { formatJwtOutput } from "@/lib/jwt/format";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("parseJwt", () => {
  it("decodes header and payload from a standard HS256 token", () => {
    const result = parseJwt(TOKEN);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(result.value.payload).toEqual({
      sub: "1234567890",
      name: "John Doe",
      iat: 1516239022,
    });
    expect(result.value.signature).toBe("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
  });

  it("accepts base64url segments containing - and _", () => {
    // payload segment encodes { "s": "blobs are non-text ￭" } → contains - _ chars
    const token =
      "eyJhbGciOiJIUzI1NiJ9.eyJzIjoiYmxvYnMgYXJlIG5vbi10ZXh0IO-_rSJ9.c2ln";
    const result = parseJwt(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.header).toEqual({ alg: "HS256" });
    expect(result.value.payload).toEqual({ s: "blobs are non-text ￭" });
  });

  it("accepts a Bearer authorization prefix around the token", () => {
    const result = parseJwt(`Bearer ${TOKEN}`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.payload.name).toBe("John Doe");
  });

  it("accepts lowercase or tab-separated bearer labels", () => {
    expect(parseJwt(`bearer\t${TOKEN}`).ok).toBe(true);
    expect(parseJwt(` BEARER ${TOKEN} `).ok).toBe(true);
  });

  it("rejects a bearer label with no token", () => {
    expect(parseJwt("Bearer").ok).toBe(false);
  });

it("rejects inputs that do not have exactly 3 parts", () => {
    expect(parseJwt("aa.bb").ok).toBe(false);
    expect(parseJwt("aa.bb.cc.dd").ok).toBe(false);
    expect(parseJwt("").ok).toBe(false);
  });

  it("rejects empty segments", () => {
    expect(parseJwt("aa..cc").ok).toBe(false);
    expect(parseJwt(".bb.cc").ok).toBe(false);
    expect(parseJwt("aa.bb.").ok).toBe(false);
  });

  it("rejects characters outside the base64url alphabet", () => {
    expect(parseJwt("eyJh//g.eyJzdWI.abc").ok).toBe(false); // '/' not allowed
    expect(parseJwt("eyJhbGci.eyJzdWI.abc===").ok).toBe(false); // padding
  });

  it("rejects a header that is not JSON after decoding", () => {
    expect(parseJwt("aGVsbG8=.eyJzdWIiOiIxIn0.c2ln").ok).toBe(false); // header decodes to "hello"
  });

  it("rejects a decoded header that is not a JSON object", () => {
    expect(parseJwt("MTIz.eyJzdWIiOiIxIn0.c2ln").ok).toBe(false); // header decodes to 123
  });

  it("rejects a payload that is not valid JSON", () => {
    expect(parseJwt("eyJhbGciOiJIUzI1NiJ9.cGF5bG9hZA.c2ln").ok).toBe(false); // "payload" not JSON
  });
});

describe("extractEmbeddedJwt", () => {
  it("finds a token with a free-text label in front of it", () => {
    const result = extractEmbeddedJwt(`abcd ${TOKEN}`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.payload.name).toBe("John Doe");
  });

  it("finds a token buried in a sentence or JSON-ish text", () => {
    const result = extractEmbeddedJwt(
      JSON.stringify({ access_token: TOKEN, token_type: "Bearer" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.payload.sub).toBe("1234567890");
  });

  it("finds the token on its own line after follow-up text", () => {
    const result = extractEmbeddedJwt(`Please find your token below:\n${TOKEN}\n— Team`);
    expect(result.ok).toBe(true);
  });

  it("does not over-eagerly match version triples or URLs", () => {
    expect(extractEmbeddedJwt("visit https://example.com su u 1.2.3 today").ok).toBe(false);
    expect(extractEmbeddedJwt("a.b.c and list.end.something").ok).toBe(false);
  });
});

describe("formatJwtOutput", () => {
  it("renders HEADER and PAYLOAD sections as pretty JSON", () => {
    const result = parseJwt(TOKEN);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(formatJwtOutput(result.value)).toBe(
      'HEADER\n{\n  "alg": "HS256",\n  "typ": "JWT"\n}\n\n' +
        'PAYLOAD\n{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}',
    );
  });
});