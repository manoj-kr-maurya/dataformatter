import type {
  OpenApiDocumentModel,
  OpenApiEndpoint,
  OpenApiSecurityRequirement,
  OpenApiSecurityScheme,
} from "@/lib/openapi/types";

/**
 * Security scheme display information for an endpoint. The workbench only
 * *describes* required authentication — it never sends credentials and never
 * includes authorization secrets in generated code.
 */

export interface SecurityDisplay {
  schemeName: string;
  type: string;
  summary: string;
  scopes: string[];
  description?: string;
}

function schemeSummary(scheme: OpenApiSecurityScheme): string {
  switch (scheme.type) {
    case "apiKey":
      return `API key · ${scheme.in}`;
    case "http":
      return scheme.scheme === "bearer" ? "HTTP Bearer token" : `HTTP ${scheme.scheme}`;
    case "oauth2":
      return "OAuth 2.0";
    case "openIdConnect":
      return "OpenID Connect";
    default:
      return "Security scheme";
  }
}

/** Security requirements that apply to one endpoint (operation > document). */
export function securityFor(
  endpoint: OpenApiEndpoint,
  model: OpenApiDocumentModel,
): SecurityDisplay[] {
  const resolved: OpenApiSecurityRequirement[] =
    endpoint.security.length > 0 ? endpoint.security : model.globalSecurity;
  const displays: SecurityDisplay[] = [];
  for (const requirement of resolved) {
    for (const [name, scopes] of Object.entries(requirement)) {
      const scheme = model.securitySchemes[name];
      if (!scheme) {
        displays.push({
          schemeName: name,
          type: "unknown",
          summary: `Referenced scheme "${name}" is not defined in components.securitySchemes.`,
          scopes,
        });
        continue;
      }
      displays.push({
        schemeName: name,
        type: scheme.type ?? "unknown",
        summary: schemeSummary(scheme),
        scopes,
        description: scheme.description,
      });
    }
  }
  return displays;
}

export function requiresSecurity(
  endpoint: OpenApiEndpoint,
  model: OpenApiDocumentModel,
): boolean {
  return securityFor(endpoint, model).length > 0;
}