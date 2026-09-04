import { describe, expect, it } from "vitest";
import {
  buildBodyInit,
  buildFetchRequest,
  buildHeaders,
  buildUrl,
  isForbiddenHeaderName,
} from "@/lib/api-client/request";
import { emptyDraft, newRow, type RequestDraft } from "@/lib/api-client/types";

function draft(overrides: Partial<RequestDraft> = {}): RequestDraft {
  return { ...emptyDraft(), ...overrides };
}

describe("buildUrl", () => {
  it("appends enabled query rows in order", () => {
    const url = buildUrl(
      draft({
        url: "https://api.example.com/items?page=1",
        query: [
          newRow("limit", "10"),
          newRow("skip", "", true),
          newRow("disabled", "no", false),
          newRow("tag", "a b"),
        ],
      }),
    );
    expect(url.toString()).toBe(
      "https://api.example.com/items?page=1&limit=10&skip=&tag=a+b",
    );
  });

  it("throws for blank URLs", () => {
    expect(() => buildUrl(draft({ url: "   " }))).toThrow(/Enter a request URL/);
  });

  it("throws for relative URLs with a helpful message", () => {
    expect(() => buildUrl(draft({ url: "/api/items" }))).toThrow(/absolute URL/);
  });

  it("rejects non-http schemes", () => {
    expect(() => buildUrl(draft({ url: "ftp://example.com/file" }))).toThrow(
      /http and https/,
    );
  });
});

describe("isForbiddenHeaderName", () => {
  it("matches the WHATWG forbidden list case-insensitively", () => {
    expect(isForbiddenHeaderName("User-Agent")).toBe(true);
    expect(isForbiddenHeaderName(" cookie ")).toBe(true);
    expect(isForbiddenHeaderName("X-Custom")).toBe(false);
  });
});

describe("buildHeaders", () => {
  it("adds the JSON content type for json bodies unless overridden", () => {
    const base = draft({ method: "POST", bodyMode: "json", bodyText: "{}" });
    expect(buildHeaders(base)).toEqual([["content-type", "application/json"]]);

    const overridden = draft({
      bodyMode: "json",
      headers: [newRow("Content-Type", "application/merge-patch+json")],
    });
    expect(buildHeaders(overridden)).toEqual([
      ["content-type", "application/merge-patch+json"],
    ]);
  });

  it("never sets a content type for form-data (browser must add the boundary)", () => {
    const sent = buildHeaders(
      draft({ method: "POST", bodyMode: "form-data", formRows: [newRow("a", "1")] }),
    );
    expect(sent).toEqual([]);
  });

  it("applies bearer auth", () => {
    const sent = buildHeaders(draft({ authMode: "bearer", bearerToken: " tok123 " }));
    expect(sent).toEqual([["authorization", "Bearer tok123"]]);
  });

  it("applies basic auth as base64 of user:password", () => {
    const sent = buildHeaders(
      draft({ authMode: "basic", basicUsername: "ada", basicPassword: "s3cret" }),
    );
    expect(sent).toEqual([["authorization", `Basic ${btoa("ada:s3cret")}`]]);
  });

  it("lets explicit header rows override the auth helper", () => {
    const sent = buildHeaders(
      draft({
        authMode: "bearer",
        bearerToken: "helper",
        headers: [newRow("Authorization", "Bearer explicit")],
      }),
    );
    expect(sent).toEqual([["authorization", "Bearer explicit"]]);
  });

  it("skips disabled and nameless rows", () => {
    const sent = buildHeaders(
      draft({ headers: [newRow("", "x"), newRow("X-A", "1", false), newRow("X-B", "2")] }),
    );
    expect(sent).toEqual([["x-b", "2"]]);
  });
});

describe("buildBodyInit", () => {
  it("returns null for GET even when a body mode is selected", () => {
    const body = buildBodyInit(draft({ method: "GET", bodyMode: "json", bodyText: "{}" }));
    expect(body).toBeNull();
  });

  it("returns raw strings for json/text modes", () => {
    expect(
      buildBodyInit(draft({ method: "POST", bodyMode: "text", bodyText: "hi" })),
    ).toBe("hi");
  });

  it("builds URLSearchParams for urlencoded mode from active rows only", () => {
    const params = buildBodyInit(
      draft({
        method: "POST",
        bodyMode: "urlencoded",
        formRows: [newRow("a", "1"), newRow("b", "2", false), newRow("", "3")],
      }),
    );
    expect(params).toBeInstanceOf(URLSearchParams);
    expect(String(params)).toBe("a=1");
  });

  it("builds FormData for form-data mode", () => {
    const form = buildBodyInit(
      draft({ method: "POST", bodyMode: "form-data", formRows: [newRow("k", "v")] }),
    );
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get("k")).toBe("v");
  });
});

describe("buildFetchRequest", () => {
  it("assembles url + init together", () => {
    const built = buildFetchRequest(
      draft({ method: "POST", url: "https://api.example.com/x", bodyMode: "json", bodyText: "[]" }),
    );
    expect(built.url.toString()).toBe("https://api.example.com/x");
    expect(built.init.method).toBe("POST");
    expect(built.init.body).toBe("[]");
  });
});
