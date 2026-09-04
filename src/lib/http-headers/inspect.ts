/**
 * HTTP header inspection — paste a raw header block, get categorized findings.
 * Pure string → findings, browser-side. Warnings are phrased as observations,
 * not "required" claims (headers are optional unless a spec demands them).
 */

export type FindingTone = "ok" | "warn" | "info" | "error";

export interface HeaderFinding {
  name: string;
  value: string;
  category: string;
  tone: FindingTone;
  message: string;
}

export interface HeaderInspection {
  headers: [string, string][];
  findings: HeaderFinding[];
  /** Headers present but unrecognized — kept for completeness. */
  unknown: string[];
}

export function parseHeaderBlock(text: string): [string, string][] {
  const out: [string, string][] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const name = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (name) out.push([name, value]);
  }
  return out;
}

export function inspectHeaderBlock(text: string): HeaderInspection {
  const headers = parseHeaderBlock(text);
  const findings: HeaderFinding[] = [];
  const unknown: string[] = [];

  const valueOf = (lowerName: string): string | undefined =>
    headers.find(([name]) => name.toLowerCase() === lowerName)?.[1];

  for (const [name, value] of headers) {
    const lower = name.toLowerCase();
    switch (lower) {
      case "content-type": {
        const mediaType = value.split(";")[0].trim();
        findings.push({
          name,
          value,
          category: "Content",
          tone: "info",
          message: `Body is declared as "${mediaType}".`,
        });
        break;
      }
      case "content-length": {
        const bytes = parseInt(value, 10);
        findings.push({
          name,
          value,
          category: "Content",
          tone: isFinite(bytes) ? "ok" : "warn",
          message: isFinite(bytes) ? `Declared body size is ${bytes.toLocaleString()} bytes.` : "Content-Length should be a decimal byte count.",
        });
        break;
      }
      case "content-encoding": {
        const noSpace = value.toLowerCase().trim();
        const known = ["gzip", "br", "deflate", "zstd", "identity"];
        findings.push({
          name,
          value,
          category: "Compression",
          tone: known.includes(noSpace) ? "ok" : "warn",
          message: known.includes(noSpace)
            ? `Body is compressed with ${noSpace} — responses decode before use.`
            : `Unrecognized content coding "${value}".`,
        });
        break;
      }
      case "transfer-encoding":
        findings.push({
          name,
          value,
          category: "Compression",
          tone: "info",
          message: "Chunked transfer coding — the body arrives in streamed chunks.",
        });
        break;
      case "etag": {
        const strong = /^"/.test(value.trim()) && !/^W\//i.test(value.trim());
        findings.push({
          name,
          value,
          category: "Caching",
          tone: "info",
          message: huge(`Validator for conditional requests. ${strong ? "Strong" : "Weak"} ETag — cache revalidation uses ${value} via If-None-Match.`),
        });
        break;
      }
      case "cache-control": {
        const directives = value.split(",").map((d) => d.trim().toLowerCase());
        const has = (lexeme: string) => directives.some((d) => d === lexeme || d.startsWith(`${lexeme}=`) || d.startsWith(`${lexeme} `));
        const notes: string[] = [];
        if (has("no-store")) notes.push("no-store forbids caching the response");
        const maxAge = directives.find((d) => d.startsWith("max-age="));
        if (maxAge) {
          const seconds = parseInt(maxAge.split("=")[1], 10);
          if (isFinite(seconds)) notes.push(`max-age=${seconds} (${humanDuration(seconds)})`);
        }
        if (!has("no-store") && !has("no-cache") && !maxAge) {
          notes.push("no freshness window declared — caches may apply heuristic expiry");
        }
        findings.push({
          name,
          value,
          category: "Caching",
          tone: "info",
          message: notes.join("; "),
        });
        break;
      }
      case "expires":
        findings.push({
          name,
          value,
          category: "Caching",
          tone: "info",
          message: "HTTP-date freshness marker — superseded by Cache-Control where both are present.",
        });
        break;
      case "location":
      case "content-location":
        findings.push({
          name,
          value,
          category: "Routing",
          tone: "info",
          message: lower === "location" ? "Redirect target returned in Location." : "Alternate location for this representation.",
        });
        break;
      case "authorization":
      case "proxy-authorization":
        findings.push({
          name,
          value,
          category: "Credentials",
          tone: "error",
          message: "A credential header is present. Never log or share raw headers — treat this value as a secret.",
        });
        break;
      case "set-cookie":
      case "cookie":
        if (lower === "set-cookie") {
          const flags = value.toLowerCase();
          const missing = ["secure", "httponly"].filter((f) => !flags.includes(f));
          findings.push({
            name,
            value,
            category: "Session",
            tone: missing.length > 0 ? "warn" : "ok",
            message: missing.length > 0
              ? `Cookie is set without ${missing.join(" and ")} — consider adding ${missing.join(" and ")} for transport/script protection.`
              : "Cookie is marked HttpOnly and Secure.",
          });
        } else {
          findings.push({
            name,
            value,
            category: "Session",
            tone: "info",
            message: "Request cookie header present.",
          });
        }
        break;
      case "access-control-allow-origin": {
        const isWildcard = value.trim() === "*";
        const allowCredentials = valueOf("access-control-allow-credentials");
        const conflict = isWildcard && allowCredentials?.trim().toLowerCase() === "true";
        findings.push({
          name,
          value,
          category: "CORS",
          tone: conflict ? "error" : "ok",
          message: conflict
            ? "Access-Control-Allow-Origin: * combined with allow-credentials is rejected by browsers (cannot be a wildcard)."
            : isWildcard
              ? "Wildcard origin — any site may read browser responses from this endpoint."
              : `CORS is scoped to origin "${value}".`,
        });
        break;
      }
      case "access-control-allow-credentials":
        findings.push({
          name,
          value,
          category: "CORS",
          tone: value.trim().toLowerCase() === "true" ? "info" : "warn",
          message: value.trim().toLowerCase() === "true" ? "Browser credentials are allowed on CORS requests." : "CORS requests will carry no credentials.",
        });
        break;
      case "access-control-allow-methods":
      case "access-control-allow-headers":
      case "access-control-expose-headers":
      case "access-control-request-method":
      case "access-control-request-headers":
        findings.push({
          name,
          value,
          category: "CORS",
          tone: "info",
          message: huge(`CORS ${lower.replace("access-control-", "")} list: ${value}.`),
        });
        break;
      case "access-control-max-age":
        findings.push({
          name,
          value,
          category: "CORS",
          tone: "info",
          message: `Preflight responses may be cached ${value} seconds.`,
        });
        break;
      case "strict-transport-security": {
        const maxAgeMatch = value.match(/max-age=(\d+)/i);
        const includeSub = /includesubdomains/i.test(value);
        findings.push({
          name,
          value,
          category: "Security",
          tone: "ok",
          message: huge(`HSTS pinned: ${maxAgeMatch ? humanDuration(parseInt(maxAgeMatch[1], 10)) : "unknown duration"}${includeSub ? ", including subdomains" : ""}.`),
        });
        break;
      }
      case "content-security-policy":
        findings.push({
          name,
          value,
          category: "Security",
          tone: "info",
          message: huge("A Content-Security-Policy is set — review the source lists for the resource origins you trust."),
        });
        break;
      case "x-frame-options":
        findings.push({
          name,
          value,
          category: "Security",
          tone: value.trim().toLowerCase() === "deny" ? "ok" : "info",
          message: `Framing policy is "${value}". (CSP frame-ancestors is the modern replacement.)`,
        });
        break;
      case "x-content-type-options":
        findings.push({
          name,
          value,
          category: "Security",
          tone: value.trim().toLowerCase() === "nosniff" ? "ok" : "info",
          message: value.trim().toLowerCase() === "nosniff" ? "MIME sniffing is disabled." : "Expected value is nosniff.",
        });
        break;
      case "referrer-policy":
      case "permissions-policy":
        findings.push({
          name,
          value,
          category: "Security",
          tone: "info",
          message: `${lower.replace(/-policy$/, "-policy")} is "${value}".`,
        });
        break;
      case "x-xss-protection":
        findings.push({
          name,
          value,
          category: "Security",
          tone: "info",
          message: "X-XSS-Protection is deprecated and is ignored by modern browsers.",
        });
        break;
      case "server":
      case "x-powered-by": {
        const leak = /[A-Z]/.test(value) || /\d/.test(value);
        findings.push({
          name,
          value,
          category: "Security",
          tone: leak ? "info" : "info",
          message: huge("Server fingerprint exposed. Consider generic banners to reduce attacker reconnaissance."),
        });
        break;
      }
      case "date":
      case "last-modified":
      case "age":
      case "via":
      case "alt-svc":
        findings.push({ name, value, category: "Protocol", tone: "info", message: "Informational HTTP header." });
        break;
      case "accept-encoding":
      case "accept-language":
      case "accept":
      case "accept-charset":
      case "host":
      case "user-agent":
      case "connection":
      case "upgrade":
      case "sec-fetch-site":
      case "sec-fetch-mode":
      case "sec-fetch-dest":
        unknown.push(name);
        break;
      default:
        unknown.push(name);
    }
  }

  // Cross-header observations.
  if (valueOf("content-encoding") && valueOf("content-length") && valueOf("transfer-encoding")) {
    findings.push({
      name: "Content-Encoding",
      value: valueOf("content-encoding") ?? "",
      category: "Compression",
      tone: "warn",
      message: "Both Content-Length and Transfer-Encoding present with encoding — a real body length is undefined in this combination.",
    });
  }
  if (!valueOf("cache-control") && !valueOf("expires")) {
    findings.push({
      name: "Cache-Control",
      value: "",
      category: "Caching",
      tone: "info",
      message: "No explicit caching policy — caches may apply heuristic expiry. Optional unless the API must control freshness.",
    });
  }

  return { headers, findings, unknown: Array.from(new Set(unknown)) };
}

function huge(text: string): string {
  return text;
}

function humanDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const units: [number, string][] = [
    [31_536_000, "y"],
    [2_592_000, "mo"],
    [86_400, "d"],
    [3_600, "h"],
    [60, "m"],
  ];
  for (const [size, suffix] of units) {
    if (seconds >= size) {
      const amount = seconds / size;
      return `${amount >= 10 || Number.isInteger(amount) ? Math.round(amount) : amount.toFixed(1)}${suffix}`;
    }
  }
  return `${seconds}s`;
}