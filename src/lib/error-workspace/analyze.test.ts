import { describe, expect, it } from "vitest";
import {
  analyzeErrorWorkspace,
  buildReproductionDraft,
  buildReproductionBundle,
  exportJson,
  exportMarkdown,
  EMPTY_ERROR_WORKSPACE_INPUT,
} from "./analyze";
import { ERROR_WORKSPACE_SAMPLE } from "./sample";

describe("analyzeErrorWorkspace", () => {
  it("returns an empty session for an empty input", () => {
    const { session, logAnalysis } = analyzeErrorWorkspace({ ...EMPTY_ERROR_WORKSPACE_INPUT });
    expect(session.source).toBe("error-workspace");
    expect(logAnalysis.total).toBe(0);
    expect(session.errors).toHaveLength(0);
    expect(session.requests).toHaveLength(0);
    expect(session.responses).toHaveLength(0);
    expect(session.findings).toHaveLength(0);
  });

  it("parses a Java stack trace into a DebugError", () => {
    const { session } = analyzeErrorWorkspace({ ...EMPTY_ERROR_WORKSPACE_INPUT, errorText: ERROR_WORKSPACE_SAMPLE.errorText });
    expect(session.errors).toHaveLength(1);
    const error = session.errors[0];
    expect(error.kind).toBe("NullPointerException");
    expect(error.message.toLowerCase()).toContain("tostring");
    expect(error.frames.length).toBeGreaterThan(0);
    expect(error.frames.some((frame) => frame.includes("RewardController"))).toBe(true);
    expect(error.file).toContain("RewardController.java");
    expect(session.metadata.stackLanguage).toBeDefined();
  });

  it("detects a consistent service prefix across log lines", () => {
    const { session } = analyzeErrorWorkspace({ ...EMPTY_ERROR_WORKSPACE_INPUT, logsText: ERROR_WORKSPACE_SAMPLE.logsText });
    expect(session.metadata.service).toBe("checkout-service");
    expect(session.logs[0]?.service).toBe("checkout-service");
  });

  it("extracts a shared trace id from logs and attaches it to log entries", () => {
    const { session } = analyzeErrorWorkspace({ ...EMPTY_ERROR_WORKSPACE_INPUT, logsText: ERROR_WORKSPACE_SAMPLE.logsText });
    expect(session.traceIds).toContain("8f3a1c2e9b4d77a1");
    for (const entry of session.logs) expect(entry.traceId).toBe("8f3a1c2e9b4d77a1");
  });

  it("flags a repeated error message in logs as a warning finding", () => {
    const { session } = analyzeErrorWorkspace({ ...EMPTY_ERROR_WORKSPACE_INPUT, logsText: ERROR_WORKSPACE_SAMPLE.logsText });
    const repeat = session.findings.find((f) => f.title.startsWith("Error repeated"));
    expect(repeat).toBeDefined();
    expect(repeat?.severity).toBe("warning");
    expect(repeat?.description).toContain("downstream 503");
  });

  it("reports a critical finding when a 5xx response was pasted", () => {
    const { session } = analyzeErrorWorkspace({ ...EMPTY_ERROR_WORKSPACE_INPUT, responseStatus: "500" });
    const critical = session.findings.find((f) => f.title.includes("500"));
    expect(critical).toBeDefined();
    expect(critical?.severity).toBe("critical");
    expect(critical?.tags).toContain("failed");
  });

  it("builds normalized request and response slices from pasted evidence", () => {
    const { session } = analyzeErrorWorkspace({ ...ERROR_WORKSPACE_SAMPLE });
    expect(session.requests[0].url).toBe("https://checkout.example.com/api/rewards/active");
    expect(session.requests[0].method).toBe("GET");
    expect(session.requests[0].path).toBe("/api/rewards/active");
    expect(session.requests[0].host).toBe("checkout.example.com");
    expect(["req-77a1"]).toContain(session.requests[0].traceId);
    expect(session.responses[0].status).toBe(500);
    expect(session.responses[0].bodyMediaType).toBe("application/json");
  });

  it("recovers the method and URL from a raw request-line header block", () => {
    const input = {
      ...EMPTY_ERROR_WORKSPACE_INPUT,
      requestHeadersText: `POST /api/orders HTTP/1.1\nHost: checkout.example.com\nContent-Type: application/json`,
      requestBody: `{"items":[{"id":"3"}]}`,
    };
    const { session } = analyzeErrorWorkspace(input);
    expect(session.requests).toHaveLength(1);
    expect(session.requests[0].method).toBe("POST");
    expect(session.requests[0].url).toBe("/api/orders");
  });

  it("flags an invalid JSON body with a warning finding", () => {
    const { session } = analyzeErrorWorkspace({ ...EMPTY_ERROR_WORKSPACE_INPUT, responseBody: `{"a": }` });
    const jsonFinding = session.findings.find((f) => f.category === "json");
    expect(jsonFinding).toBeDefined();
    expect(jsonFinding?.severity).toBe("warning");
  });

  it("records metadata key=value pairs", () => {
    const { session } = analyzeErrorWorkspace({
      ...EMPTY_ERROR_WORKSPACE_INPUT,
      metadataText: "environment=staging\ndeploy=2026-09-02T09:00Z",
    });
    expect(session.metadata.environment).toBe("staging");
    expect(session.metadata.deploy).toBe("2026-09-02T09:00Z");
  });

  it("builds an hourly timeline when logs carry timestamps", () => {
    const { session } = analyzeErrorWorkspace({ ...EMPTY_ERROR_WORKSPACE_INPUT, logsText: ERROR_WORKSPACE_SAMPLE.logsText });
    expect(session.timeline.length).toBeGreaterThan(0);
    expect(session.timeline[0].category).toBe("timeline");
  });
});

describe("reproduction", () => {
  it("builds a RequestDraft from the request slice", () => {
    const draft = buildReproductionDraft(ERROR_WORKSPACE_SAMPLE);
    expect(draft).not.toBeNull();
    expect(draft?.method).toBe("GET");
    expect(draft?.url).toContain("checkout.example.com");
    expect(draft?.bodyMode).toBe("none");
  });

  it("returns null when no request was captured", () => {
    expect(buildReproductionDraft(EMPTY_ERROR_WORKSPACE_INPUT)).toBeNull();
    expect(buildReproductionBundle(EMPTY_ERROR_WORKSPACE_INPUT)).toBeNull();
  });

  it("produces cURL and code snippets", () => {
    const bundle = buildReproductionBundle(ERROR_WORKSPACE_SAMPLE);
    expect(bundle).not.toBeNull();
    expect(bundle?.curl).toContain("GET");
    expect(bundle?.codeSnippets.length).toBeGreaterThan(0);
    const fetchSnippet = bundle?.codeSnippets.find((s) => s.id === "fetch");
    expect(fetchSnippet?.code).toContain("fetch");
  });
});

describe("exports", () => {
  it("exports markdown with all expected sections", () => {
    const { session } = analyzeErrorWorkspace(ERROR_WORKSPACE_SAMPLE);
    const markdown = exportMarkdown(session);
    expect(markdown).toContain("## Findings");
    expect(markdown).toContain("## Errors");
    expect(markdown).toContain("## Requests");
    expect(markdown).toContain("## Responses");
    expect(markdown).toContain("## Logs");
    expect(markdown).toContain("## Metadata");
    expect(markdown).toContain("NullPointerException");
  });

  it("exports JSON that round-trips the core session", () => {
    const { session } = analyzeErrorWorkspace(ERROR_WORKSPACE_SAMPLE);
    const parsed = JSON.parse(exportJson(session));
    expect(parsed.source).toBe("error-workspace");
    expect(parsed.findings.length).toBe(session.findings.length);
    expect(parsed.metadata).toBeDefined();
  });
});