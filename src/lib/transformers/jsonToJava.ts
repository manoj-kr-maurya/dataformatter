import { parseJson } from "@/lib/json/validate";
import type { TransformationResult } from "@/types/transformation";
import { failResult, okResult } from "@/lib/transformers/builders";
import { isPlainObject } from "@/lib/transformers/jsonTable";

const JAVA_KEYWORDS = new Set([
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "default", "do", "double", "else", "enum",
  "extends", "final", "finally", "float", "for", "goto", "if", "implements",
  "import", "instanceof", "int", "interface", "long", "native", "new", "package",
  "private", "protected", "public", "return", "short", "static", "strictfp",
  "super", "switch", "synchronized", "this", "throw", "throws", "transient",
  "try", "void", "volatile", "while",
]);

function cleanIdent(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9_$]/g, "");
  return /^\d/.test(cleaned) ? `_${cleaned}` : cleaned;
}

function pascalCase(key: string): string {
  const parts = key.split(/[^A-Za-z0-9_$]+/).filter(Boolean);
  if (parts.length === 0) {
    return "Data";
  }
  const pascal = parts
    .map((part) => {
      const cleaned = cleanIdent(part);
      if (JAVA_KEYWORDS.has(cleaned)) {
        return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}Field`;
      }
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    })
    .join("");
  return JAVA_KEYWORDS.has(pascal) ? `${pascal}Value` : pascal;
}

function camelCase(key: string): string {
  const pascal = pascalCase(key);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function singularize(key: string): string {
  if (/s$/.test(key) && !/ss$/.test(key) && key.length > 1) {
    return key.slice(0, -1);
  }
  return key;
}

function scalarJavaType(value: unknown): string {
  if (value === null || value === undefined) {
    return "Object";
  }
  if (typeof value === "string") {
    return "String";
  }
  if (typeof value === "boolean") {
    return "Boolean";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? "Long" : "Double";
  }
  return "Object";
}

interface Field {
  name: string;
  type: string;
}

interface ClassDef {
  name: string;
  fields: Field[];
  nested: ClassDef[];
}

/**
 * Build a tree of class definitions from a root JSON object.
 * Field types reference nested class names; nested classes are collated under
 * their declaring class so the output stays readable.
 */
function inferRoot(value: unknown): ClassDef | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const resolveNested = (
    className: string,
    objValue: Record<string, unknown>,
  ): ClassDef => buildClass(pascalCase(className), objValue);

  const buildClass = (name: string, obj: Record<string, unknown>): ClassDef => {
    const fields: Field[] = [];
    const nested: ClassDef[] = [];

    Object.entries(obj).forEach(([key, child]) => {
      let type: string;
      if (isPlainObject(child)) {
        const nestedName = pascalCase(singularize(key));
        const nestedDef = resolveNested(nestedName, child);
        nested.push(nestedDef);
        type = nestedDef.name;
      } else if (Array.isArray(child)) {
        const element = child.length > 0 ? child[0] : null;
        if (isPlainObject(element)) {
          const nestedName = pascalCase(singularize(key));
          const nestedDef = resolveNested(nestedName, element);
          nested.push(nestedDef);
          type = `List<${nestedDef.name}>`;
        } else if (element !== null && typeof element === "object") {
          type = "List<Object>";
        } else {
          type = `List<${scalarJavaType(element)}>`;
        }
      } else {
        type = scalarJavaType(child);
      }
      fields.push({ name: camelCase(key), type });
    });

    return { name, fields, nested };
  };

  return buildClass("Root", value);
}

function renderClass(clazz: ClassDef, pad = "", isNested = false): string {
  const inner = "  ";
  const lines: string[] = [];
  const classKeyword = isNested ? "public static class" : "public class";
  lines.push(`${pad}${classKeyword} ${clazz.name} {`);
  lines.push(`${pad}${inner}`);

  clazz.fields.forEach((field) => {
    lines.push(`${pad}${inner}${inner}private ${field.type} ${field.name};`);
  });

  if (clazz.fields.length > 0) {
    lines.push(`${pad}${inner}`);
  }

  lines.push(`${pad}${inner}${inner}public ${clazz.name}() {`);
  lines.push(`${pad}${inner}${inner}}`);

  clazz.fields.forEach((field) => {
    const capName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
    lines.push(`${pad}${inner}`);
    lines.push(`${pad}${inner}${inner}public ${field.type} get${capName}() {`);
    lines.push(`${pad}${inner}${inner}${inner}return ${field.name};`);
    lines.push(`${pad}${inner}${inner}}`);
    lines.push(`${pad}${inner}`);
    lines.push(`${pad}${inner}${inner}public void set${capName}(${field.type} ${field.name}) {`);
    lines.push(`${pad}${inner}${inner}${inner}this.${field.name} = ${field.name};`);
    lines.push(`${pad}${inner}${inner}}`);
  });

  clazz.nested.forEach((nested) => {
    lines.push(`${pad}${inner}`);
    lines.push(...renderClass(nested, `${pad}${inner}`, true).split("\n"));
  });

  lines.push(`${pad}}`);
  return lines.join("\n");
}

export function jsonToJava(input: string): TransformationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return failResult(input, "There is no JSON to convert.", "UNKNOWN", "JSON");
  }

  const parsed = parseJson(trimmed);
  if (!parsed.ok) {
    return failResult(input, `Invalid JSON: ${parsed.error.message}`, "JSON", "JSON");
  }

  const root = inferRoot(parsed.value);
  if (!root) {
    return failResult(
      input,
      "JSON to Java requires a JSON object to map onto a class.",
      "JSON",
      "JSON",
    );
  }

  return okResult(
    input,
    renderClass(root),
    "JSON_TO_JAVA",
    "TEXT",
    "JSON converted to Java",
    "JSON",
  );
}