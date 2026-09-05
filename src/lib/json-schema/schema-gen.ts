import {
  type SchemaNode,
  ROOT_NAME,
  rootObject,
} from "@/lib/json-schema/infer";

/**
 * Validation-schema generators sharing the same SchemaNode IR as the code
 * generators. Each returns pretty-printed text plus a file extension.
 */

export interface SchemaGenerator {
  id: string;
  label: string;
  extension: string;
  generate: (node: SchemaNode, typeName: string) => string;
}

// ------------------------------------------------------------ JSON Schema

function jsonSchemaNode(node: SchemaNode): Record<string, unknown> {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "null": return { type: ["null"] };
        case "boolean": return { type: "boolean" };
        case "integer": return { type: "integer" };
        case "number": return { type: "number" };
        case "string": {
          const out: Record<string, unknown> = { type: "string" };
          if (node.format === "date-time") out.format = "date-time";
          else if (node.format === "date") out.format = "date";
          else if (node.format === "email") out.format = "email";
          else if (node.format === "uuid") out.format = "uuid";
          else if (node.format === "url") out.format = "uri";
          return out;
        }
      }
      return { type: "string" };
    case "array":
      return {
        type: "array",
        items: node.items ? jsonSchemaNode(node.items) : { type: "string" },
      };
    case "object": {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const prop of node.props ?? []) {
        properties[prop.name] = jsonSchemaNode(prop.node);
        if (!prop.optional) required.push(prop.name);
      }
      const out: Record<string, unknown> = { type: "object", properties };
      if (required.length > 0) out.required = required;
      return out;
    }
  }
}

const jsonSchemaGenerator: SchemaGenerator = {
  id: "json-schema",
  label: "JSON Schema",
  extension: "json",
  generate: (node, typeName) => {
    const root = jsonSchemaNode(rootObject(node));
    return JSON.stringify(
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        title: typeName,
        ...root,
      },
      null,
      2,
    );
  },
};

// ---------------------------------------------------------------- Zod

function zodExpr(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": return "z.boolean()";
        case "integer": return "z.number().int()";
        case "number": return "z.number()";
        case "null": return "z.null()";
        case "string":
          if (node.format === "email") return "z.string().email()";
          if (node.format === "uuid") return "z.string().uuid()";
          if (node.format === "date-time" || node.format === "date") return "z.string().datetime()";
          if (node.format === "url") return "z.string().url()";
          return "z.string()";
      }
      return "z.string()";
    case "array":
      return `z.array(${zodExpr(node.items ?? { kind: "scalar", scalar: "string" })})`;
    case "object": {
      const props = (node.props ?? []).map(
        (p) => `  ${p.name}: ${zodExpr(p.node)}${p.optional ? ".optional()" : ""}`,
      );
      return `z.object({\n${props.join(",\n")}\n})`;
    }
  }
}

const zodGenerator: SchemaGenerator = {
  id: "zod",
  label: "Zod schema",
  extension: "ts",
  generate: (node, typeName) => {
    const expr = zodExpr(rootObject(node));
    return `import { z } from "zod";\n\nexport const ${pascalName(typeName)}Schema = ${expr};\n\nexport type ${pascalName(typeName)} = z.infer<typeof ${pascalName(typeName)}Schema>;`;
  },
};

// ------------------------------------------------------------- Pydantic

function pydanticType(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": return "bool";
        case "integer": return "int";
        case "number": return "float";
        case "null": return "None";
        case "string": return "str";
      }
      return "str";
    case "array":
      return `list[${pydanticType(node.items ?? { kind: "scalar", scalar: "string" })}]`;
    case "object":
      return "dict[str, object]";
  }
}

const pydanticGenerator: SchemaGenerator = {
  id: "pydantic",
  label: "Pydantic model",
  extension: "py",
  generate: (node, typeName) => {
    const lines: string[] = ["from pydantic import BaseModel", "", "", `class ${pascalName(typeName)}(BaseModel):`];
    const props = (rootObject(node).props ?? []);
    if (props.length === 0) {
      lines.push("    pass");
    } else {
      for (const p of props) {
        lines.push(`    ${fieldName(p.name)}: ${pydanticType(p.node)}${p.optional ? " | None = None" : ""}`);
      }
    }
    return lines.join("\n");
  },
};

// -------------------------------------------------------------- OpenAPI

const openApiGenerator: SchemaGenerator = {
  id: "openapi",
  label: "OpenAPI schema",
  extension: "yaml",
  generate: (node, typeName) => {
    const schema = jsonSchemaNode(rootObject(node));
    return [
      "# Component schema for OpenAPI 3.x — reference as:",
      `#   components.schemas.${pascalName(typeName)}`,
      `${pascalName(typeName)}:`,
      ...JSON.stringify(schema, null, 2)
        .split("\n")
        .map((l) => (l === "{" || l === "}" ? `  ${l}` : `  ${l}`)),
    ].join("\n");
  },
};

// ------------------------------------------------------------- NestJS DTO

function nestJsType(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": return "boolean";
        case "integer": return "number";
        case "number": return "number";
        case "null": return "string";
        case "string": return "string";
      }
      return "string";
    case "array":
      return `${nestJsType(node.items ?? { kind: "scalar", scalar: "string" })}[]`;
    case "object":
      return "Record<string, unknown>";
  }
}

function nestJsDecorator(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": return "@IsBoolean()";
        case "integer":
        case "number": return "@IsNumber()";
        case "string": return node.format === "email" ? "@IsEmail()" : "@IsString()";
        case "null": return "@IsOptional()";
      }
      return "@IsString()";
    case "array": return "@IsArray()";
    case "object": return "@IsObject()";
  }
}

const nestJsGenerator: SchemaGenerator = {
  id: "nestjs-dto",
  label: "NestJS DTO",
  extension: "ts",
  generate: (node, typeName) => {
    const props = (rootObject(node).props ?? []).map(
      (p) => `  @ApiProperty()\n  ${nestJsDecorator(p.node)}\n  readonly ${fieldName(p.name)}: ${nestJsType(p.node)}${p.optional ? "?" : ""};`,
    );
    return [
      "import { ApiProperty } from \"@nestjs/swagger\";",
      "import { IsString, IsNumber, IsBoolean, IsEmail, IsArray, IsObject, IsOptional } from \"class-validator\";",
      "",
      `export class ${pascalName(typeName)}Dto {`,
      ...props,
      "}",
    ].join("\n");
  },
};

// --------------------------------------------------------------- Prisma

/** Prisma scalar-list types are only available for scalar items. */
function prismaType(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": return "Boolean";
        case "integer": return "Int";
        case "number": return "Float";
        case "null": return "Json";
        case "string": return "String";
      }
      return "String";
    case "array": {
      const items = node.items ?? { kind: "scalar", scalar: "string" };
      if (items.kind === "scalar") return `${prismaType(items)}[]`;
      return "Json";
    }
    case "object":
      return "Json";
  }
}

const prismaGenerator: SchemaGenerator = {
  id: "prisma",
  label: "Prisma schema",
  extension: "prisma",
  generate: (node, typeName) => {
    const props = rootObject(node).props ?? [];
    const lines: string[] = [`model ${pascalName(typeName)} {`];
    for (const p of props) {
      lines.push(`  ${fieldName(p.name)}  ${prismaType(p.node)}${p.optional ? "?" : ""}`);
    }
    lines.push("}");
    return lines.join("\n");
  },
};

function pascalName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9]/g, "_").replace(/^[0-9]+/, "_$&");
  return cleaned.replace(/^./, (c) => c.toUpperCase());
}

function fieldName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_$]/g, "_");
  return /^[A-Za-z_$]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

export const SCHEMA_GENERATORS: readonly SchemaGenerator[] = [
  jsonSchemaGenerator,
  zodGenerator,
  pydanticGenerator,
  openApiGenerator,
  nestJsGenerator,
  prismaGenerator,
];

export function generateSchema(id: string, node: SchemaNode, typeName = ROOT_NAME): string {
  const generator = SCHEMA_GENERATORS.find((g) => g.id === id);
  if (!generator) {
    throw new Error(`Unknown schema generator "${id}"`);
  }
  return generator.generate(node, typeName);
}