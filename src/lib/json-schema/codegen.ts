import {
  type SchemaNode,
  type JsonSchemaProp,
  ROOT_NAME,
  rootObject,
} from "@/lib/json-schema/infer";

/**
 * Language generators for JSON → code. Each generator turns the shared
 * SchemaNode IR into source text; adding a language is a single new entry in
 * GENERATORS (keyed by id) plus a human label + file extension.
 */

export interface CodeGenerator {
  id: string;
  label: string;
  extension: string;
  generate: (node: SchemaNode, typeName: string) => string;
}

/** Strip characters illegal in most identifiers; guarantee a token. */
function ident(name: string, fallback = "field"): string {
  const cleaned = name.replace(/[^A-Za-z0-9_$]/g, "_").replace(/^[0-9]+/, "_$&");
  return cleaned.length > 0 ? cleaned : fallback;
}

const RESERVED_TS = new Set(["string", "number", "boolean", "function", "new", "delete", "in", "typeof", "class", "interface", "export", "extends", "return", "this", "null", "undefined"]);
const RESERVED_JAVA = new Set(["public", "private", "protected", "static", "class", "interface", "int", "long", "double", "String", "Object", "List", "Map", "record", "new", "this", "return", "package", "import", "void", "boolean"]);
const RESERVED_GO = new Set(["func", "type", "struct", "map", "int", "string", "bool", "float64", "package", "return", "var", "const", "interface", "chan", "go", "defer", "range", "if", "for"]);
const RESERVED_PY = new Set(["class", "def", "from", "import", "return", "if", "elif", "else", "for", "while", "in", "not", "and", "or", "lambda", "with", "as", "pass", "True", "False", "None", "async", "await"]);
const RESERVED_CS = new Set(["class", "string", "int", "long", "double", "bool", "object", "List", "Dictionary", "public", "private", "get", "set", "namespace", "return", "new", "void", "var", "record", "this"]);
const RESERVED_KOTLIN = new Set(["class", "data", "val", "var", "object", "String", "Int", "Long", "Double", "Boolean", "List", "Map", "Any", "fun", "return", "package", "import", "This"]);
const RESERVED_SWIFT = new Set(["struct", "class", "let", "var", "func", "String", "Int", "Double", "Bool", "import", "return", "if", "for", "Some", "None", "Optional", "Array", "Dictionary", "Self"]);

const isReserved = (word: string, set: Set<string>) => set.has(word);
const safe = (name: string, set: Set<string>) => {
  const id = ident(name);
  return isReserved(id, set) ? `_${id}` : id;
};

const pascal = (name: string) => {
  const id = ident(name);
  return id.replace(/^[a-z]/, (c) => c.toUpperCase());
};
const camel = (name: string) => {
  const id = ident(name);
  return id.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
};

// ---------------------------------------------------------------- TypeScript

function tsType(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "null": return "null";
        case "boolean": return "boolean";
        case "number":
        case "integer": return "number";
        case "string": return "string";
      }
      return "string";
    case "array":
      return `${tsType(node.items ?? { kind: "scalar", scalar: "string" })}[]`;
    case "object": {
      const props = node.props ?? [];
      if (props.length === 0) return "Record<string, unknown>";
      return `{ ${props.map((p) => `${JSON.stringify(p.name)}${p.optional ? "?" : ""}: ${tsType(p.node)}`).join(", ")} }`;
    }
  }
}

const tsGenerator: CodeGenerator = {
  id: "typescript-interface",
  label: "TypeScript interface",
  extension: "ts",
  generate: (node, typeName) => {
    const props = (rootObject(node).props ?? []).map(
      (p) => `  ${safe(p.name, RESERVED_TS)}${p.optional ? "?" : ""}: ${tsType(p.node)}`,
    );
    return `export interface ${pascal(typeName)} {\n${props.join(",\n")}\n}`;
  },
};

const tsTypeGenerator: CodeGenerator = {
  id: "typescript-type",
  label: "TypeScript type",
  extension: "ts",
  generate: (node, typeName) => {
    const props = (rootObject(node).props ?? []).map(
      (p) => `  ${safe(p.name, RESERVED_TS)}${p.optional ? "?" : ""}: ${tsType(p.node)};`,
    );
    return `export type ${pascal(typeName)} = {\n${props.join("\n")}\n};`;
  },
};

// ------------------------------------------------------------------ Java

function javaFieldType(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": return "boolean";
        case "integer": return "long";
        case "number": return "double";
        case "null": return "Object";
        case "string": return "String";
      }
      return "String";
    case "array":
      return `List<${javaFieldType(node.items ?? { kind: "scalar", scalar: "string" })}>`;
    case "object":
      return "Map<String, Object>";
  }
}

const javaGenerator: CodeGenerator = {
  id: "java-class",
  label: "Java class",
  extension: "java",
  generate: (node, typeName) => {
    const fields = (rootObject(node).props ?? []).map(
      (p) => `  private ${javaFieldType(p.node)} ${safe(camel(p.name), RESERVED_JAVA)} ${p.optional ? "= null;" : ";"}`,
    );
    return `public class ${pascal(typeName)} {\n\n${fields.join("\n")}\n\n}`;
  },
};

const javaRecordGenerator: CodeGenerator = {
  id: "java-record",
  label: "Java record",
  extension: "java",
  generate: (node, typeName) => {
    const params = (rootObject(node).props ?? []).map(
      (p) => `${javaFieldType(p.node)} ${safe(camel(p.name), RESERVED_JAVA)}`,
    );
    return `public record ${pascal(typeName)}(${params.join(", ")}) {}`;
  },
};

// -------------------------------------------------------------- C# / .NET

function csType(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": return "bool";
        case "integer": return "long";
        case "number": return "double";
        case "null": return "object";
        case "string": return "string";
      }
      return "string";
    case "array":
      return `List<${csType(node.items ?? { kind: "scalar", scalar: "string" })}>`;
    case "object":
      return "Dictionary<string, object>";
  }
}

const csGenerator: CodeGenerator = {
  id: "csharp-class",
  label: "C# class",
  extension: "cs",
  generate: (node, typeName) => {
    const props = (rootObject(node).props ?? []).map((p) => {
      const property = pascal(safe(p.name, RESERVED_CS));
      return `  public ${csType(p.node)} ${property} { get; set; }${p.optional ? " = null;" : ""}`;
    });
    return `public class ${pascal(typeName)}\n{\n${props.join("\n")}\n}`;
  },
};

// ---------------------------------------------------------------- Go

function goType(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": return "bool";
        case "integer": return "int";
        case "number": return "float64";
        case "null": return "interface{}";
        case "string": return "string";
      }
      return "string";
    case "array":
      return `[]${goType(node.items ?? { kind: "scalar", scalar: "string" })}`;
    case "object": {
      const props = node.props ?? [];
      if (props.length === 0) return "map[string]interface{}";
      return `struct {\n${props.map((p) => `\t${pascal(p.name)} ${goType(p.node)} \`json:"${p.name}"\``).join("\n")}\n\t}`;
    }
  }
}

const goGenerator: CodeGenerator = {
  id: "go-struct",
  label: "Go struct",
  extension: "go",
  generate: (node, typeName) => {
    const props = (rootObject(node).props ?? []).map(
      (p) => `\t${pascal(safe(p.name, RESERVED_GO))} ${goType(p.node)} \`json:"${p.name}"\``,
    );
    return `type ${pascal(typeName)} struct {\n${props.join("\n")}\n}`;
  },
};

// -------------------------------------------------------------- Python

function pyType(node: SchemaNode, optional: boolean): string {
  let base = "str";
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": base = "bool"; break;
        case "integer": base = "int"; break;
        case "number": base = "float"; break;
        case "null": base = "None"; break;
        case "string": base = "str"; break;
      }
      break;
    case "array":
      base = `List[${pyType(node.items ?? { kind: "scalar", scalar: "string" }, false)}]`;
      break;
    case "object":
      base = "dict";
      break;
  }
  return optional ? `Optional[${base}]` : base;
}

const pyGenerator: CodeGenerator = {
  id: "python-dataclass",
  label: "Python dataclass",
  extension: "py",
  generate: (node, typeName) => {
    const classNode = rootObject(node);
    const lines: string[] = [
      "from dataclasses import dataclass",
      "from typing import List, Optional",
      "",
      "",
      `@dataclass`,
      `class ${pascal(typeName)}:`,
    ];
    const props = classNode.props ?? [];
    if (props.length === 0) {
      lines.push("    pass");
    } else {
      for (const p of props) {
        const name = safe(camel(p.name), RESERVED_PY);
        const defaultPart = p.optional ? " = None" : "";
        lines.push(`    ${name}: ${pyType(p.node, p.optional)}${defaultPart}`);
      }
    }
    return lines.join("\n");
  },
};

// -------------------------------------------------------------- Kotlin

function ktType(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": return "Boolean";
        case "integer": return "Long";
        case "number": return "Double";
        case "null": return "Any";
        case "string": return "String";
      }
      return "String";
    case "array":
      return `List<${ktType(node.items ?? { kind: "scalar", scalar: "string" })}>`;
    case "object":
      return "Map<String, Any>";
  }
}

const kotlinGenerator: CodeGenerator = {
  id: "kotlin-data-class",
  label: "Kotlin data class",
  extension: "kt",
  generate: (node, typeName) => {
    const params = (rootObject(node).props ?? []).map(
      (p) => `    val ${safe(camel(p.name), RESERVED_KOTLIN)}: ${ktType(p.node)}` + (p.optional ? "? = null" : ""),
    );
    return `data class ${pascal(typeName)}(\n${params.join(",\n")}\n)`;
  },
};

// -------------------------------------------------------------- Swift

function swiftType(node: SchemaNode): string {
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": return "Bool";
        case "integer": return "Int";
        case "number": return "Double";
        case "null": return "String?";
        case "string": return "String";
      }
      return "String";
    case "array":
      return `[${swiftType(node.items ?? { kind: "scalar", scalar: "string" })}]`;
    case "object": {
      const props = node.props ?? [];
      if (props.length === 0) return "[String: String]";
      return `struct {\n${props.map((p) => `    let ${safe(p.name, RESERVED_SWIFT)}: ${swiftType(p.node)}${p.optional ? "?" : ""}`).join("\n")}\n  }`;
    }
  }
}

const swiftGenerator: CodeGenerator = {
  id: "swift-struct",
  label: "Swift struct",
  extension: "swift",
  generate: (node, typeName) => {
    const props = (rootObject(node).props ?? []).map(
      (p) => `  let ${safe(p.name, RESERVED_SWIFT)}: ${swiftType(p.node)}${p.optional ? "?" : ""}`,
    );
    return `struct ${pascal(typeName)}: Codable {\n${props.join("\n")}\n}`;
  },
};

// ------------------------------------------------------------------ Dart

const RESERVED_DART = new Set([
  "class", "extends", "implements", "static", "final", "const", "var", "new",
  "void", "null", "true", "false", "this", "super", "if", "else", "for",
  "while", "switch", "case", "default", "return", "import", "export", "library",
  "as", "in", "is", "on", "with", "abstract", "async", "await", "yield",
]);

function dartType(node: SchemaNode, optional: boolean): string {
  let base: string;
  switch (node.kind) {
    case "scalar":
      switch (node.scalar) {
        case "boolean": base = "bool"; break;
        case "integer": base = "int"; break;
        case "number": base = "double"; break;
        case "null": base = "Null"; break;
        case "string": base = "String"; break;
        default: base = "String"; break;
      }
      break;
    case "array":
      base = `List<${dartType(node.items ?? { kind: "scalar", scalar: "string" }, false)}>`;
      break;
    case "object":
      base = "Map<String, dynamic>";
      break;
  }
  return optional ? `${base}?` : base;
}

/** Expression that reads a JSON value for one field in a Dart fromJson factory. */
function dartFromJsonExpr(p: JsonSchemaProp): string {
  const ref = `json['${p.name}']`;
  if (p.node.kind === "array") {
    const itemType = dartType(p.node.items ?? { kind: "scalar", scalar: "string" }, false);
    return p.optional
      ? `(${ref} as List?)?.cast<${itemType}>()`
      : `(${ref} as List).cast<${itemType}>()`;
  }
  if (p.node.kind === "object") {
    return p.optional ? `${ref} as Map<String, dynamic>?` : `${ref} as Map<String, dynamic>`;
  }
  if (p.node.scalar === "number") {
    return `${ref} == null ? null : (${ref} as num).toDouble()`;
  }
  const type = dartType(p.node, p.optional);
  return `${ref} as ${type}`;
}

const dartGenerator: CodeGenerator = {
  id: "dart-class",
  label: "Dart class",
  extension: "dart",
  generate: (node, typeName) => {
    const className = pascal(typeName);
    const props = rootObject(node).props ?? [];
    const fields = props.map((p) => {
      const name = safe(camel(p.name), RESERVED_DART);
      return `  final ${dartType(p.node, p.optional)} ${name};`;
    });
    const params = props.map((p) => {
      const name = safe(camel(p.name), RESERVED_DART);
      return p.optional ? `    this.${name},` : `    required this.${name},`;
    });
    const ctor = props.length > 0
      ? `  ${className}({\n${params.join("\n")}\n  });`
      : `  ${className}();`;
    const reads = props.map((p) => {
      const name = safe(camel(p.name), RESERVED_DART);
      return `      ${name}: ${dartFromJsonExpr(p)},`;
    });
    const factory = props.length > 0
      ? `  factory ${className}.fromJson(Map<String, dynamic> json) => ${className}(\n${reads.join("\n")}\n  );`
      : `  factory ${className}.fromJson(Map<String, dynamic> json) => ${className}();`;
    const writes = props.map((p) => {
      const name = safe(camel(p.name), RESERVED_DART);
      return `    '${p.name}': ${name},`;
    });
    const toJson = props.length > 0
      ? `  Map<String, dynamic> toJson() => {\n${writes.join("\n")}\n  };`
      : `  Map<String, dynamic> toJson() => {};`;
    return `class ${className} {\n${fields.join("\n")}\n\n${ctor}\n\n${factory}\n\n${toJson}\n}`;
  },
};

export const CODE_GENERATORS: readonly CodeGenerator[] = [
  tsGenerator,
  tsTypeGenerator,
  javaGenerator,
  javaRecordGenerator,
  csGenerator,
  goGenerator,
  pyGenerator,
  kotlinGenerator,
  swiftGenerator,
  dartGenerator,
];

export function generateCode(id: string, node: SchemaNode, typeName = ROOT_NAME): string {
  const generator = CODE_GENERATORS.find((g) => g.id === id);
  if (!generator) {
    throw new Error(`Unknown generator "${id}"`);
  }
  return generator.generate(node, typeName);
}