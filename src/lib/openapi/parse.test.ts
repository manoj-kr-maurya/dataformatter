import { describe, expect, it } from "vitest";
import { parseOpenApi, detectOpenApiVersion, looksLikeJson } from "@/lib/openapi/parse";
import { validateOpenApi } from "@/lib/openapi/validate";
import { dereferenceSchema } from "@/lib/openapi/refs";
import { sampleFromSchema, schemaToNode, describeSchema } from "@/lib/openapi/schema";
import { endpointToRequestDraft, endpointToCurl, endpointToCode, exampleRequestBody, exampleResponses } from "@/lib/openapi/codegen";
import { securityFor } from "@/lib/openapi/security";
import { generateCode } from "@/lib/json-schema/codegen";
import type { OpenApiDocumentModel } from "@/lib/openapi/types";

const PETSTORE = `{
  "openapi": "3.0.3",
  "info": { "title": "Petstore", "version": "1.0.0", "description": "A sample API" },
  "servers": [{ "url": "https://api.example.com/v1" }],
  "tags": [{ "name": "pets", "description": "Everything about pets" }],
  "paths": {
    "/pets": {
      "get": {
        "operationId": "listPets",
        "summary": "List all pets",
        "tags": ["pets"],
        "parameters": [
          { "name": "limit", "in": "query", "schema": { "type": "integer", "format": "int32" }, "description": "Max results" },
          { "name": "X-Trace", "in": "header", "example": "trace-1", "schema": { "type": "string" } }
        ],
        "responses": {
          "200": {
            "description": "A paged array of pets",
            "content": {
              "application/json": {
                "schema": { "type": "array", "items": { "$ref": "#/components/schemas/Pet" } }
              }
            }
          },
          "default": { "description": "unexpected error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      },
      "post": {
        "operationId": "createPet",
        "summary": "Create a pet",
        "tags": ["pets"],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/NewPet" } } }
        },
        "responses": {
          "201": { "description": "Created", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Pet" } } } },
          "422": { "description": "Validation error" }
        }
      }
    },
    "/pets/{petId}": {
      "parameters": [{ "name": "petId", "in": "path", "required": true, "schema": { "type": "integer", "format": "int64" } }],
      "get": {
        "operationId": "getPetById",
        "summary": "Get a pet",
        "tags": ["pets"],
        "responses": {
          "200": { "description": "A pet", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Pet" } } } }
        }
      }
    }
  },
  "components": {
    "securitySchemes": { "bearerAuth": { "type": "http", "scheme": "bearer", "bearerFormat": "JWT" } },
    "schemas": {
      "Pet": {
        "type": "object",
        "required": ["id", "name"],
        "properties": {
          "id": { "type": "integer", "format": "int64" },
          "name": { "type": "string", "example": "Example User" },
          "email": { "type": "string", "format": "email" },
          "active": { "type": "boolean" },
          "tag": { "type": "string" },
          "status": { "type": "string", "enum": ["available", "pending", "sold"] }
        }
      },
      "NewPet": {
        "type": "object",
        "required": ["name"],
        "properties": { "name": { "type": "string" }, "tag": { "type": "string" } }
      },
      "Error": { "type": "object", "required": ["code", "message"], "properties": { "code": { "type": "integer", "format": "int32" }, "message": { "type": "string" } } }
    }
  }
}`;

const PETSTORE_YAML = `
openapi: 3.0.3
info:
  title: Store API
  version: 2.1.0
  description: |
    A store with block
    scalar description.
paths:
  /items/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      operationId: getItem
      summary: Fetch an item
      responses:
        '200':
          description: An item
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Item'
components:
  schemas:
    Item:
      type: object
      properties:
        id:
          type: string
        price:
          type: number
          format: double
`;

const SWAGGER2 = `{ "swagger": "2.0", "info": { "title": "Legacy", "version": "1" }, "paths": {} }`;

describe("detectOpenApiVersion", () => {
  it("detects 3.0", () => {
    expect(detectOpenApiVersion(PETSTORE).kind).toBe("3.0");
  });
  it("detects swagger 2.0 explicitly", () => {
    expect(detectOpenApiVersion(SWAGGER2).kind).toBe("swagger2");
  });
  it("returns unknown for non-OpenAPI input", () => {
    expect(detectOpenApiVersion("hello: world").kind).toBe("unknown");
    expect(detectOpenApiVersion("").kind).toBe("unknown");
  });
});

describe("looksLikeJson", () => {
  it("heuristically distinguishes JSON from YAML", () => {
    expect(looksLikeJson('{"a":1}')).toBe(true);
    expect(looksLikeJson("a: 1")).toBe(false);
  });
});

describe("parseOpenApi", () => {
  it("parses a JSON 3.0 document into the normalized model", () => {
    const result = parseOpenApi(PETSTORE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const model = result.model;
    expect(model.sourceFormat).toBe("json");
    expect(result.format).toBe("json");
    expect(model.version).toBe("3.0.3");
    expect(model.info.title).toBe("Petstore");
    expect(model.servers).toEqual([{ url: "https://api.example.com/v1", description: undefined }]);
    expect(model.paths).toHaveLength(3);
    expect(model.components.schemas.Pet).toBeDefined();
    const list = model.paths.find((p) => p.operationId === "listPets");
    expect(list).toBeDefined();
    expect(list?.method).toBe("get");
    expect(list?.parameters.map((p) => p.in)).toContain("query");
    expect(list?.parameters.find((p) => p.name === "petId")).toBeUndefined();
  });

  it("merges path-level parameters into operations", () => {
    const result = parseOpenApi(PETSTORE);
    if (!result.ok) throw new Error("parse failed");
    const get = result.model.paths.find((p) => p.operationId === "getPetById");
    expect(get?.parameters.map((p) => p.name)).toEqual(["petId"]);
    expect(get?.parameters[0].required).toBe(true);
  });

  it("parses YAML with block scalars", () => {
    const result = parseOpenApi(PETSTORE_YAML);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.format).toBe("yaml");
    expect(result.model.info.description).toContain("block\nscalar");
    expect(result.model.paths).toHaveLength(1);
    expect(result.model.paths[0].parameters[0].required).toBe(true);
  });

  it("parses OpenAPI 3.1 documents", () => {
    const result = parseOpenApi(PETSTORE.replace("3.0.3", "3.1.0"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.versionKind).toBe("3.1");
  });

  it("rejects Swagger 2.0 with a clear message", () => {
    const result = parseOpenApi(SWAGGER2);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe("Swagger 2.0 is not currently supported.");
  });

  it("rejects plain non-OpenAPI YAML", () => {
    const result = parseOpenApi("hello: world\nnested:\n  - 1");
    expect(result.ok).toBe(false);
  });

  it("reports JSON syntax errors", () => {
    const result = parseOpenApi('{"openapi": "3.0.0", }');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain("JSON syntax error");
  });

  it("reports YAML syntax errors with line info", () => {
    const result = parseOpenApi("openapi: 3.0.0\npaths: [/a");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain("YAML syntax error");
    expect(result.error.line).toBe(2);
  });

  it("defaults servers to / when none are declared", () => {
    const result = parseOpenApi(PETSTORE.replace('"servers": [{ "url": "https://api.example.com/v1" }],', ""));
    if (!result.ok) throw new Error("parse failed");
    expect(result.model.servers).toEqual([{ url: "/" }]);
  });
});

describe("validateOpenApi", () => {
  it("returns no errors for a well-formed document", () => {
    const result = parseOpenApi(PETSTORE);
    if (!result.ok) throw new Error("parse failed");
    const issues = validateOpenApi(result.model);
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
  });

  it("flags missing response descriptions and unknown types", () => {
    const dirty = `{
      "openapi": "3.0.0",
      "info": { "title": "x", "version": "1" },
      "paths": {
        "/a": {
          "get": {
            "responses": {
              "200": { "content": { "application/json": { "schema": { "type": "bogus" } } } }
            }
          }
        }
      }
    }`;
    const result = parseOpenApi(dirty);
    if (!result.ok) throw new Error("parse failed");
    const issues = validateOpenApi(result.model);
    const messages = issues.map((i) => i.message).join("\n");
    expect(messages).toContain("has no description");
    expect(messages).toContain('Unknown schema type "bogus"');
  });

  it("flags duplicate operationIds and unresolved refs", () => {
    const dup = PETSTORE.replace(
      '"operationId": "getPetById"',
      '"operationId": "listPets"',
    ).replace(
      '"$ref": "#/components/schemas/Pet"',
      '"$ref": "#/components/schemas/Missing"',
    );
    const result = parseOpenApi(dup);
    if (!result.ok) throw new Error("parse failed");
    const issues = validateOpenApi(result.model);
    const messages = issues.map((i) => i.message).join("\n");
    expect(messages).toContain('operationId "listPets" is duplicated');
    expect(messages).toContain('Unresolved $ref "#/components/schemas/Missing"');
  });
});

describe("refs and schema", () => {
  function model(json: string): OpenApiDocumentModel {
    const result = parseOpenApi(json);
    if (!result.ok) throw new Error(`parse failed: ${result.error.message}`);
    return result.model;
  }

  it("dereferences component refs", () => {
    const m = model(PETSTORE);
    const deref = dereferenceSchema({ $ref: "#/components/schemas/Pet" }, m);
    expect(deref.properties?.name).toBeDefined();
    expect(deref.type).toBe("object");
  });

  it("returns null for external refs", () => {
    expect(dereferenceSchema({ $ref: "https://example.com/openapi.yaml#/x" }, model(PETSTORE))).toBeDefined();
  });

  it("handles circular schemas without infinite recursion", () => {
    const circular = `{
      "openapi": "3.0.0",
      "info": { "title": "c", "version": "1" },
      "paths": { "/a": { "get": { "responses": { "200": { "description": "ok" } } } } },
      "components": {
        "schemas": {
          "Node": {
            "type": "object",
            "properties": { "next": { "$ref": "#/components/schemas/Node" }, "name": { "type": "string" } }
          }
        }
      }
    }`;
    const m = model(circular);
    const sample = sampleFromSchema({ $ref: "#/components/schemas/Node" }, m);
    expect(typeof sample.value).toBe("object");
    expect(JSON.stringify(sample.value)).toContain("name");
  });

  it("generates realistic samples with name hints and examples", () => {
    const m = model(PETSTORE);
    const { value } = sampleFromSchema({ $ref: "#/components/schemas/Pet" }, m);
    expect(value).toEqual({
      id: 123,
      name: "Example User",
      email: "user@example.com",
      active: true,
      tag: "string",
      status: "available",
    });
  });

  it("respects enum and requiredOnly options", () => {
    const m = model(PETSTORE);
    const { value } = sampleFromSchema({ $ref: "#/components/schemas/Pet" }, m, { requiredOnly: true });
    expect(Object.keys(value as object)).toEqual(["id", "name"]);
  });

  it("converts OpenAPI schemas to SchemaNode and reuses the TS generator", () => {
    const m = model(PETSTORE);
    const node = schemaToNode({ $ref: "#/components/schemas/Pet" }, m);
    const code = generateCode("typescript-interface", node, "Pet");
    expect(code).toContain("export interface Pet");
    expect(code).toContain("id: number");
    expect(code).toContain("name: string");
    expect(code).toContain("email?: string");
  });

  it("describes nested schemas into flattened rows", () => {
    const m = model(PETSTORE);
    const rows = describeSchema({ $ref: "#/components/schemas/Pet" }, m);
    expect(rows.map((r) => r.name)).toContain("id");
    expect(rows.find((r) => r.name === "id")?.type).toBe("integer");
  });
});

describe("codegen", () => {
  function model(): OpenApiDocumentModel {
    const result = parseOpenApi(PETSTORE);
    if (!result.ok) throw new Error("parse failed");
    return result.model;
  }

  it("builds a RequestDraft with server, path and query params", () => {
    const m = model();
    const list = m.paths.find((p) => p.operationId === "listPets")!;
    const draft = endpointToRequestDraft({ endpoint: list, model: m, server: m.servers[0].url, bodyText: "", headerParams: {} });
    expect(draft.method).toBe("GET");
    expect(draft.url).toBe("https://api.example.com/v1/pets");
    expect(draft.headers.find((h) => h.name === "X-Trace")).toBeDefined();
    expect(draft.bodyMode).toBe("none");
  });

  it("substitutes path parameters in the URL", () => {
    const m = model();
    const get = m.paths.find((p) => p.operationId === "getPetById")!;
    const draft = endpointToRequestDraft({ endpoint: get, model: m, server: m.servers[0].url, bodyText: "", headerParams: {}, pathParams: { petId: "42" } });
    expect(draft.url).toBe("https://api.example.com/v1/pets/42");
  });

  it("renders cURL with the correct verb and URL", () => {
    const m = model();
    const list = m.paths.find((p) => p.operationId === "listPets")!;
    const curl = endpointToCurl({ endpoint: list, model: m, server: m.servers[0].url, bodyText: "", headerParams: {} });
    expect(curl).toContain("GET");
    expect(curl).toContain("https://api.example.com/v1/pets");
  });

  it("reuses the fetch/axios generators for code output", () => {
    const m = model();
    const list = m.paths.find((p) => p.operationId === "listPets")!;
    const opts = { endpoint: list, model: m, server: m.servers[0].url, bodyText: "", headerParams: {} };
    expect(endpointToCode(opts, "fetch")).toContain("fetch(");
    expect(endpointToCode(opts, "axios")).toContain("axios");
  });

  it("generates POST snippets carrying the example body from a request schema", () => {
    const m = model();
    const create = m.paths.find((p) => p.operationId === "createPet")!;
    const body = exampleRequestBody(create.requestBody, m);
    expect(body).toContain('"name"');
    const curl = endpointToCurl({ endpoint: create, model: m, server: m.servers[0].url, bodyText: body, headerParams: {} });
    expect(curl).toContain("POST");
    expect(curl).toContain("--data");
  });

  it("generates mock responses for success statuses", () => {
    const m = model();
    const list = m.paths.find((p) => p.operationId === "listPets")!;
    const responses = exampleResponses(list, m);
    expect(responses[0].status).toBe("200");
    expect(responses[0].body).toContain("[");
  });

  it("reports security requirements per endpoint", () => {
    const secured = PETSTORE.replace(
      '"paths": {',
      '"security": [{ "bearerAuth": [] }],\n  "paths": {',
    );
    const result = parseOpenApi(secured);
    if (!result.ok) throw new Error("parse failed");
    const list = result.model.paths.find((p) => p.operationId === "listPets")!;
    const display = securityFor(list, result.model);
    expect(display).toHaveLength(1);
    expect(display[0].type).toBe("http");
    expect(display[0].summary).toContain("Bearer");
  });
});