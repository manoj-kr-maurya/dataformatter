import { describe, expect, it } from "vitest";
import { autoTransform } from "@/lib/processing/autoTransform";

const HS256_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("autoTransform", () => {
  it("decodes a JWT into formatted HEADER and PAYLOAD sections", () => {
    const result = autoTransform(HS256_TOKEN);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JWT_DECODE");
    expect(result.detectedType).toBe("JWT");
    expect(result.output).toBe(
      'HEADER\n{\n  "alg": "HS256",\n  "typ": "JWT"\n}\n\n' +
        'PAYLOAD\n{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}',
    );
    expect(result.message).toBe("Detected: JWT — decoded header and payload (signature not verified)");
  });
  it("decodes a JWT pasted with a Bearer prefix", () => {
    const result = autoTransform(`Bearer ${HS256_TOKEN}`);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JWT_DECODE");
    expect(result.output).toContain('"name": "John Doe"');
  });

  it("decodes a JWT embedded in surrounding text", () => {
    const result = autoTransform(`unrelated prefix text ${HS256_TOKEN} and suffix`);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JWT_DECODE");
    expect(result.output).toContain('"name": "John Doe"');
  });

  it("keeps empty input with a waiting message", () => {
    const result = autoTransform("");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("NONE");
    expect(result.message).toBe("Waiting for input.");
    expect(result.output).toBe("");
  });

  it("treats whitespace-only input as empty", () => {
    expect(autoTransform("   \n\t ").transformation).toBe("NONE");
  });

  it("pretty-prints valid JSON objects", () => {
    const input = '{"name":"John","age":30}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_FORMAT");
    expect(result.detectedType).toBe("JSON");
    expect(result.output).toBe('{\n  "name": "John",\n  "age": 30\n}');
    expect(result.message).toBe("Detected: JSON — pretty-printed");
  });

  it("pretty-prints nested JSON and arrays", () => {
    const input = '{"user":{"name":"John","roles":["admin","user"]}}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.output).toBe(
      '{\n  "user": {\n    "name": "John",\n    "roles": [\n      "admin",\n      "user"\n    ]\n  }\n}',
    );
  });

  it("pretty-prints JSON with unicode values", () => {
    const input = '{"message":"नमस्ते"}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.output).toBe('{\n  "message": "नमस्ते"\n}');
  });

  it("decodes Base64 that contains plain text", () => {
    const result = autoTransform("SGVsbG8gV29ybGQ=");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("BASE64_DECODE");
    expect(result.detectedType).toBe("TEXT");
    expect(result.output).toBe("Hello World");
    expect(result.message).toBe("Detected: Base64 — decoded to plain text");
  });

  it("decodes Base64 and pretty-prints embedded JSON", () => {
    const result = autoTransform("eyJuYW1lIjoiSm9obiIsImFnZSI6MzB9");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("BASE64_TO_JSON");
    expect(result.detectedType).toBe("JSON");
    expect(result.output).toBe('{\n  "name": "John",\n  "age": 30\n}');
    expect(result.message).toBe("Detected: Base64 — decoded to JSON");
  });

  it("decodes unpadded Base64", () => {
    const result = autoTransform("eyJuYW1lIjoiSm9obiJ9");
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("BASE64_TO_JSON");
    expect(result.output).toBe('{\n  "name": "John"\n}');
  });

  it("leaves unknown input untouched with an error message", () => {
    const input = "hello world";
    const result = autoTransform(input);
    expect(result.success).toBe(false);
    expect(result.output).toBe(input);
    expect(result.originalInput).toBe(input);
    expect(result.message).toContain("Unable to confidently detect a format");
  });

  it("is idempotent on JSON output — reformatting its own output stays JSON", () => {
    const once = autoTransform('{"a":1}');
    const twice = autoTransform(once.output);
    expect(twice.success).toBe(true);
    expect(twice.transformation).toBe("JSON_FORMAT");
    expect(twice.output).toBe(once.output);
  });

  it("recursively decodes a base64 JSON value into a nested object", () => {
    const input = '{"payload": "eyJmb28iOiJiYXIifQ=="}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_DECODE_BASE64");
    expect(result.output).toBe('{\n  "payload": {\n    "foo": "bar"\n  }\n}');
    expect(result.message).toBe("Detected: JSON — recursively decoded Base64 field values");
  });

  it("recursively decodes base64 inside nested objects and arrays", () => {
    const input = '{"user":{"roles":["eyJhZGRlZCI6dHJ1ZX0="]}}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.output).toBe(
      '{\n  "user": {\n    "roles": [\n      {\n        "added": true\n      }\n    ]\n  }\n}',
    );
  });

  it("decodes a base64 plain-text value to a string", () => {
    const input = '{"greeting": "SGVsbG8gV29ybGQ="}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_DECODE_BASE64");
    expect(result.output).toBe('{\n  "greeting": "Hello World"\n}');
  });

  it("does not decode ordinary strings that only look close to base64", () => {
    const input = '{"msg": "Hello World"}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_FORMAT");
    expect(result.output).toBe('{\n  "msg": "Hello World"\n}');
  });

  it("is idempotent after recursive decode — output has no base64 left", () => {
    const once = autoTransform('{"payload": "eyJmb28iOiJiYXIifQ=="}');
    const twice = autoTransform(once.output);
    expect(twice.success).toBe(true);
    expect(twice.transformation).toBe("JSON_FORMAT");
    expect(twice.output).toBe(once.output);
  });

  it("decodes a JWT value inside JSON into header/payload/signature", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const input = `{"token": "${jwt}"}`;
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_DECODE_BASE64");
    expect(result.output).toBe(
      '{\n  "token": {\n    "header": {\n      "alg": "HS256",\n      "typ": "JWT"\n    },\n    "payload": {\n      "sub": "1234567890",\n      "name": "John Doe",\n      "iat": 1516239022\n    },\n    "signature": "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"\n  }\n}',
    );
    expect(result.message).toBe("Detected: JSON — recursively decoded Base64 field values");
  });

  it("salvages a leading JSON document and labels ignored trailing content", () => {
    const input = '{"a": 1} this is not json';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_SALVAGE");
    expect(result.output).toBe('{\n  "a": 1\n}');
    expect(result.message).toContain("Partially valid JSON");
    expect(result.message).toContain("Trailing content");
  });

  it("recursively decodes base64 in a salvaged document", () => {
    const input = '{"payload":"eyJmb28iOiJiYXIifQ=="} junk here';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_SALVAGE");
    expect(result.output).toBe('{\n  "payload": {\n    "foo": "bar"\n  }\n}');
    expect(result.message).toContain("recursively decoded Base64");
  });

  it("does not say 'recursively decoded' when the salvaged document has no base64", () => {
    const result = autoTransform('{"a":1} trailing');
    expect(result.transformation).toBe("JSON_SALVAGE");
    expect(result.message).not.toContain("recursively decoded");
    expect(result.message).toContain("extracted the complete document.");
  });

  it("keeps unchanged behavior when JSON cannot be salvaged, repaired, or decoded", () => {
    const input = '{"a" 1}';
    const result = autoTransform(input);
    expect(result.success).toBe(false);
    expect(result.output).toBe(input);
    expect(result.message).toContain("Unable to confidently detect");
  });

  it("auto-repairs an unterminated JSON value and recursively decodes base64", () => {
    const result = autoTransform('{"a":"SGVsbG8="');
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_SALVAGE");
    expect(result.output).toBe('{\n  "a": "Hello"\n}');
    expect(result.message).toContain("auto-closed and parsed");
    expect(result.message).toContain("recursively decoded");
  });

  it("auto-repairs unclosed nested JSON and decodes nested base64", () => {
    const result = autoTransform('{"payload":{"deep":"eyJ4IjoxfQ=="');
    expect(result.success).toBe(true);
    expect(result.output).toBe(
      '{\n  "payload": {\n    "deep": {\n      "x": 1\n    }\n  }\n}',
    );
  });

  it("auto-repairs without a decode note when there is no base64", () => {
    const result = autoTransform('{"name": "John", "age": 30');
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_SALVAGE");
    expect(result.output).toBe('{\n  "name": "John",\n  "age": 30\n}');
    expect(result.message).toContain("auto-closed and parsed");
    expect(result.message).not.toContain("recursively decoded");
  });

  it("decodes intact base64 values in a fragment when repair fails", () => {
    const result = autoTransform('{"a": "SGVsbG8=",');
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_SALVAGE");
    expect(result.output).toBe('{"a": "Hello",');
    expect(result.message).toContain("decoded intact Base64");
    expect(result.message).toContain("may be partial");
  });

  it("joins multiple JSON documents as JSONL without losing data", () => {
    const input = '{"a":1} {"b":2}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_TO_JSONL");
    expect(result.output).toBe('{"a":1}\n{"b":2}');
    expect(result.message).toContain("2 JSON documents");
  });

  it("recursively decodes base64 values in each JSONL document", () => {
    const input = '{"a":1} {"b":"eyJhIjoxfQ=="}';
    const result = autoTransform(input);
    expect(result.success).toBe(true);
    expect(result.transformation).toBe("JSON_TO_JSONL");
    expect(result.output).toBe('{"a":1}\n{"b":{"a":1}}');
  });

  it.each([
    ['{"greeting":"SGVsbG8="}', '{\n  "greeting": "Hello"\n}'],
    ['{"a":[{"b":"eyJjIjoxfQ=="}]}', '{\n  "a": [\n    {\n      "b": {\n        "c": 1\n      }\n    }\n  ]\n}'],
  ])("recursively decodes nested base64 after base64→JSON for %s", (decodedJson, expected) => {
    const input = btoa(decodedJson);
    const result = autoTransform(input);
    expect(result.transformation).toBe("JSON_DECODE_BASE64");
    expect(result.output).toBe(expected);
    expect(result.message).toContain("then recursively decoded");
  });

  it("decodes a JWT value inside base64→JSON into header/payload/signature", () => {
    const inner = '{"token":"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2ln"}';
    const result = autoTransform(btoa(inner));
    expect(result.transformation).toBe("JSON_DECODE_BASE64");
    const parsed = JSON.parse(result.output);
    expect(parsed.token.header.alg).toBe("HS256");
    expect(parsed.token.payload.sub).toBe("1");
    expect(parsed.token.signature).toBe("c2ln");
  });

  it("keeps BASE64_TO_JSON when the decoded JSON has no nested base64", () => {
    const result = autoTransform(btoa('{"name":"John"}'));
    expect(result.transformation).toBe("BASE64_TO_JSON");
    expect(result.output).toBe('{\n  "name": "John"\n}');
  });
});