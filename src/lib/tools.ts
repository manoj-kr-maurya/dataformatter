import type { ToolMode, ToolType, TransformationResult } from "@/types/tools";
import { autoTransform } from "@/lib/processing/autoTransform";
import { base32Decoder } from "@/lib/transformers/base32Decoder";
import { base32Encoder } from "@/lib/transformers/base32Encoder";
import { base58Decoder } from "@/lib/transformers/base58Decoder";
import { base58Encoder } from "@/lib/transformers/base58Encoder";
import { base64Decoder } from "@/lib/transformers/base64Decoder";
import { base64Encoder } from "@/lib/transformers/base64Encoder";
import { base64ToBinary } from "@/lib/transformers/base64ToBinary";
import { base64ToCsv } from "@/lib/transformers/base64ToCsv";
import { base64ToHex } from "@/lib/transformers/base64ToHex";
import { base64ToImage } from "@/lib/transformers/base64ToImage";
import { base64ToJson } from "@/lib/transformers/base64ToJson";
import { base64ToTsv } from "@/lib/transformers/base64ToTsv";
import { base64ToXml } from "@/lib/transformers/base64ToXml";
import { base64ToYaml } from "@/lib/transformers/base64ToYaml";
import { binaryToBase64 } from "@/lib/transformers/binaryToBase64";
import { csvToBase64 } from "@/lib/transformers/csvToBase64";
import { hexToBase64 } from "@/lib/transformers/hexToBase64";
import { hexToUtf8 } from "@/lib/transformers/hexToUtf8";
import { htmlDecoder } from "@/lib/transformers/htmlDecoder";
import { htmlEncoder } from "@/lib/transformers/htmlEncoder";
import { imageToBase64 } from "@/lib/transformers/imageToBase64";
import { jpgToBase64 } from "@/lib/transformers/jpgToBase64";
import { jsonDecoder } from "@/lib/transformers/jsonDecoder";
import { jsonEncoder } from "@/lib/transformers/jsonEncoder";
import { jsonFormatter } from "@/lib/transformers/jsonFormatter";
import { jsonMinifier } from "@/lib/transformers/jsonMinifier";
import { jsonToBase64 } from "@/lib/transformers/jsonToBase64";
import { jsonToCsv } from "@/lib/transformers/jsonToCsv";
import { jsonToExcel } from "@/lib/transformers/jsonToExcel";
import { jsonToHtml } from "@/lib/transformers/jsonToHtml";
import { jsonToJava } from "@/lib/transformers/jsonToJava";
import { jsonToText } from "@/lib/transformers/jsonToText";
import { jsonToTsv } from "@/lib/transformers/jsonToTsv";
import { jsonToXml } from "@/lib/transformers/jsonToXml";
import { jsonToYaml } from "@/lib/transformers/jsonToYaml";
import { jsonUrlDecoder } from "@/lib/transformers/jsonUrlDecoder";
import { jsonUrlEncoder } from "@/lib/transformers/jsonUrlEncoder";
import { jwtDecoder } from "@/lib/transformers/jwtDecoder";
import { octalToBase64 } from "@/lib/transformers/octalToBase64";
import { pngToBase64 } from "@/lib/transformers/pngToBase64";
import { tsvToBase64 } from "@/lib/transformers/tsvToBase64";
import { urlDecoder } from "@/lib/transformers/urlDecoder";
import { urlEncoder } from "@/lib/transformers/urlEncoder";
import { utf8Converter } from "@/lib/transformers/utf8Converter";
import { utf8Decoder } from "@/lib/transformers/utf8Decoder";
import { xmlToBase64 } from "@/lib/transformers/xmlToBase64";
import { xmlUrlDecoder } from "@/lib/transformers/xmlUrlDecoder";
import { xmlUrlEncoder } from "@/lib/transformers/xmlUrlEncoder";
import { yamlToBase64 } from "@/lib/transformers/yamlToBase64";

export const AUTO_DETECT = "AUTO_DETECT" as const;

export type Transformer = (input: string) => TransformationResult;

export const MANUAL_TOOLS: Record<ToolType, Transformer> = {
  JSON_FORMAT: jsonFormatter,
  JSON_MINIFY: jsonMinifier,
  JSON_ENCODE: jsonEncoder,
  JSON_DECODE: jsonDecoder,
  BASE32_ENCODE: base32Encoder,
  BASE32_DECODE: base32Decoder,
  BASE58_ENCODE: base58Encoder,
  BASE58_DECODE: base58Decoder,
  BASE64_ENCODE: base64Encoder,
  BASE64_DECODE: base64Decoder,
  BASE64_TO_JSON: base64ToJson,
  JSON_TO_BASE64: jsonToBase64,
  IMAGE_TO_BASE64: imageToBase64,
  BASE64_TO_IMAGE: base64ToImage,
  PNG_TO_BASE64: pngToBase64,
  JPG_TO_BASE64: jpgToBase64,
  XML_TO_BASE64: xmlToBase64,
  YAML_TO_BASE64: yamlToBase64,
  BASE64_TO_XML: base64ToXml,
  BASE64_TO_YAML: base64ToYaml,
  CSV_TO_BASE64: csvToBase64,
  BASE64_TO_CSV: base64ToCsv,
  TSV_TO_BASE64: tsvToBase64,
  BASE64_TO_TSV: base64ToTsv,
  BINARY_TO_BASE64: binaryToBase64,
  BASE64_TO_BINARY: base64ToBinary,
  HEX_TO_BASE64: hexToBase64,
  BASE64_TO_HEX: base64ToHex,
  OCTAL_TO_BASE64: octalToBase64,
  JSON_TO_JAVA: jsonToJava,
  JSON_TO_XML: jsonToXml,
  JSON_TO_YAML: jsonToYaml,
  JSON_TO_CSV: jsonToCsv,
  JSON_TO_TSV: jsonToTsv,
  JSON_TO_TEXT: jsonToText,
  JSON_TO_EXCEL: jsonToExcel,
  JSON_TO_HTML: jsonToHtml,
  JWT_DECODE: jwtDecoder,
  URL_ENCODE: urlEncoder,
  URL_DECODE: urlDecoder,
  JSON_URL_ENCODE: jsonUrlEncoder,
  JSON_URL_DECODE: jsonUrlDecoder,
  HTML_ENCODE: htmlEncoder,
  HTML_DECODE: htmlDecoder,
  XML_URL_ENCODE: xmlUrlEncoder,
  XML_URL_DECODE: xmlUrlDecoder,
  UTF8_CONVERTER: utf8Converter,
  UTF8_DECODE: utf8Decoder,
  HEX_TO_UTF8: hexToUtf8,
};

export const TOOL_META: Record<ToolType, { label: string; description: string }> = {
  JSON_FORMAT: { label: "JSON Format", description: "Prettify JSON with 2-space indentation." },
  JSON_MINIFY: { label: "JSON Minify", description: "Compress JSON into a single line." },
  JSON_ENCODE: {
    label: "JSON Encode Online",
    description: "Escape text as a JSON string literal (with quotes and escapes).",
  },
  JSON_DECODE: {
    label: "JSON Decode Online",
    description: "Unescape a JSON string literal back to its raw text.",
  },
  BASE32_ENCODE: { label: "Base32 Encode", description: "Encode text as RFC 4648 Base32." },
  BASE32_DECODE: { label: "Base32 Decode", description: "Decode Base32 back to text." },
  BASE58_ENCODE: {
    label: "Base58 Encode",
    description: "Encode text as Base58 using the Bitcoin alphabet.",
  },
  BASE58_DECODE: {
    label: "Base58 Decode",
    description: "Decode Base58 (Bitcoin alphabet) back to text.",
  },
  BASE64_ENCODE: { label: "Base64 Encode", description: "Encode text as UTF-8 Base64." },
  BASE64_DECODE: { label: "Base64 Decode", description: "Decode Base64 back to text." },
  BASE64_TO_JSON: { label: "Base64 → JSON", description: "Decode Base64 and require valid JSON." },
  JSON_TO_BASE64: { label: "JSON → Base64", description: "Validate JSON and encode it as Base64." },
  IMAGE_TO_BASE64: {
    label: "Image to Base64",
    description: "Convert a PNG/JPG data URI into a Base64 string.",
  },
  BASE64_TO_IMAGE: {
    label: "Base64 to Image",
    description: "Turn a Base64 string into an image data URI.",
  },
  PNG_TO_BASE64: {
    label: "PNG to Base64",
    description: "Validate a PNG image and convert it to Base64.",
  },
  JPG_TO_BASE64: {
    label: "JPG to Base64",
    description: "Validate a JPG image and convert it to Base64.",
  },
  XML_TO_BASE64: { label: "XML → Base64", description: "Validate XML and encode it as Base64." },
  YAML_TO_BASE64: { label: "YAML → Base64", description: "Validate YAML and encode it as Base64." },
  BASE64_TO_XML: { label: "Base64 → XML", description: "Decode Base64 and require valid XML." },
  BASE64_TO_YAML: {
    label: "Base64 → YAML",
    description: "Decode Base64 back to YAML text.",
  },
  CSV_TO_BASE64: { label: "CSV → Base64", description: "Validate CSV and encode it as Base64." },
  BASE64_TO_CSV: { label: "Base64 → CSV", description: "Decode Base64 back to CSV text." },
  TSV_TO_BASE64: { label: "TSV → Base64", description: "Validate TSV and encode it as Base64." },
  BASE64_TO_TSV: { label: "Base64 → TSV", description: "Decode Base64 back to TSV text." },
  BINARY_TO_BASE64: { label: "Binary to Base64", description: "Convert 0/1 bits into Base64." },
  BASE64_TO_BINARY: { label: "Base64 to Binary", description: "Decode Base64 into 0/1 bits." },
  HEX_TO_BASE64: { label: "Hex to Base64", description: "Convert a hex string into Base64." },
  BASE64_TO_HEX: { label: "Base64 to Hex", description: "Decode Base64 into a hex string." },
  OCTAL_TO_BASE64: { label: "Octal to Base64", description: "Convert octal byte values into Base64." },
  JSON_TO_JAVA: {
    label: "JSON to Java",
    description: "Generate a Java class from a JSON object.",
  },
  JSON_TO_XML: {
    label: "JSON to XML",
    description: "Convert a JSON object into an XML document.",
  },
  JSON_TO_YAML: {
    label: "JSON to YAML",
    description: "Convert JSON into human-readable YAML.",
  },
  JSON_TO_CSV: {
    label: "JSON to CSV",
    description: "Flatten an array of objects into CSV rows.",
  },
  JSON_TO_TSV: {
    label: "JSON to TSV",
    description: "Flatten an array of objects into TSV rows.",
  },
  JSON_TO_TEXT: {
    label: "JSON to Text",
    description: "Render JSON as readable key/value plain text.",
  },
  JSON_TO_EXCEL: {
    label: "JSON to Excel",
    description: "Render array data as an Excel-openable HTML table.",
  },
  JSON_TO_HTML: {
    label: "JSON to HTML",
    description: "Render JSON as a nested HTML list.",
  },
  JWT_DECODE: {
    label: "JWT Decode",
    description: "Decode a JWT header and payload (no signature verification).",
  },
  URL_ENCODE: {
    label: "URL Encode Online",
    description: "Percent-encode a string for safe use in a URL.",
  },
  URL_DECODE: {
    label: "URL Decode Online",
    description: "Decode percent-encoded URL text.",
  },
  JSON_URL_ENCODE: {
    label: "JSON URL Encode",
    description: "Validate JSON, then percent-encode it for a URL.",
  },
  JSON_URL_DECODE: {
    label: "JSON URL Decode",
    description: "Percent-decode a payload and format the JSON inside it.",
  },
  HTML_ENCODE: {
    label: "HTML Encode",
    description: "Escape &, <, >, \" and ' as HTML entities.",
  },
  HTML_DECODE: {
    label: "HTML Decode",
    description: "Decode named and numeric HTML entities back to text.",
  },
  XML_URL_ENCODE: {
    label: "XML URL Encoding",
    description: "Percent-encode content for embedding URLs in XML.",
  },
  XML_URL_DECODE: {
    label: "XML URL Decoding",
    description: "Percent-decode XML-safe URL content.",
  },
  UTF8_CONVERTER: {
    label: "UTF8 Converter",
    description: "Convert non-ASCII text to \\uXXXX UTF-8 escape sequences.",
  },
  UTF8_DECODE: {
    label: "UTF8 Decode",
    description: "Resolve \\uXXXX / \\xNN escapes back to UTF-8 text.",
  },
  HEX_TO_UTF8: {
    label: "Hex to UTF8",
    description: "Decode a hex string into UTF-8 text.",
  },
};

/** Manual tools shown on the home page (/). */
export const HOME_TOOL_ORDER: ToolType[] = [
  "JSON_FORMAT",
  "JSON_MINIFY",
  "BASE64_TO_JSON",
  "JSON_TO_BASE64",
  "JWT_DECODE",
];

/** Encoding/decoding tools shown on /encode-decode. */
export const ENCODE_DECODE_TOOL_ORDER: ToolType[] = [
  "BASE32_ENCODE",
  "BASE32_DECODE",
  "BASE58_ENCODE",
  "BASE58_DECODE",
  "BASE64_ENCODE",
  "BASE64_DECODE",
  "URL_ENCODE",
  "URL_DECODE",
  "JSON_URL_ENCODE",
  "JSON_URL_DECODE",
  "HTML_ENCODE",
  "HTML_DECODE",
  "XML_URL_ENCODE",
  "XML_URL_DECODE",
  "UTF8_CONVERTER",
  "UTF8_DECODE",
  "HEX_TO_UTF8",
  "JSON_DECODE",
  "JSON_ENCODE",
];

/** Base64 tools shown on /base64. */
export const BASE64_TOOL_ORDER: ToolType[] = [
  "IMAGE_TO_BASE64",
  "BASE64_TO_IMAGE",
  "PNG_TO_BASE64",
  "JPG_TO_BASE64",
  "JSON_TO_BASE64",
  "XML_TO_BASE64",
  "YAML_TO_BASE64",
  "BASE64_TO_JSON",
  "BASE64_TO_XML",
  "BASE64_TO_YAML",
  "CSV_TO_BASE64",
  "BASE64_TO_CSV",
  "TSV_TO_BASE64",
  "BASE64_TO_TSV",
  "BINARY_TO_BASE64",
  "BASE64_TO_BINARY",
  "HEX_TO_BASE64",
  "BASE64_TO_HEX",
  "OCTAL_TO_BASE64",
];

/** JSON converter tools shown on /json-converter. */
export const JSON_CONVERTER_TOOL_ORDER: ToolType[] = [
  "JSON_TO_JAVA",
  "JSON_TO_XML",
  "JSON_TO_YAML",
  "JSON_TO_CSV",
  "JSON_TO_TSV",
  "JSON_TO_TEXT",
  "JSON_TO_EXCEL",
  "JSON_TO_HTML",
];

function dedupe(tools: ToolType[]): ToolType[] {
  return Array.from(new Set(tools));
}

/** Every manual tool in the app — retained for registry-level consumers. */
export const MANUAL_TOOL_ORDER: ToolType[] = dedupe([
  ...HOME_TOOL_ORDER,
  ...ENCODE_DECODE_TOOL_ORDER,
  ...BASE64_TOOL_ORDER,
  ...JSON_CONVERTER_TOOL_ORDER,
]);

/**
 * Tiered categories for the tool menu. Each group is a collapsible branch in
 * the hamburger menu; new tool types slot into these groups (or add a new
 * group) without touching the menu component.
 */
export interface ToolGroup {
  label: string;
  tools: ToolType[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    label: "Encoding Tools",
    tools: [
      "BASE32_ENCODE",
      "BASE32_DECODE",
      "BASE58_ENCODE",
      "BASE58_DECODE",
      "BASE64_ENCODE",
      "BASE64_DECODE",
      "URL_ENCODE",
      "URL_DECODE",
      "JSON_URL_ENCODE",
      "JSON_URL_DECODE",
      "HTML_ENCODE",
      "HTML_DECODE",
      "XML_URL_ENCODE",
      "XML_URL_DECODE",
      "UTF8_CONVERTER",
      "UTF8_DECODE",
      "HEX_TO_UTF8",
      "JSON_ENCODE",
      "JSON_DECODE",
    ],
  },
  {
    label: "JSON Tools",
    tools: ["JSON_FORMAT", "JSON_MINIFY"],
  },
  {
    label: "JSON Converters",
    tools: [
      "JSON_TO_JAVA",
      "JSON_TO_XML",
      "JSON_TO_YAML",
      "JSON_TO_CSV",
      "JSON_TO_TSV",
      "JSON_TO_TEXT",
      "JSON_TO_EXCEL",
      "JSON_TO_HTML",
    ],
  },
  {
    label: "Conversions",
    tools: ["BASE64_TO_JSON", "JSON_TO_BASE64"],
  },
  {
    label: "Base64 Tools",
    tools: [
      "IMAGE_TO_BASE64",
      "BASE64_TO_IMAGE",
      "PNG_TO_BASE64",
      "JPG_TO_BASE64",
      "XML_TO_BASE64",
      "YAML_TO_BASE64",
      "BASE64_TO_XML",
      "BASE64_TO_YAML",
      "CSV_TO_BASE64",
      "BASE64_TO_CSV",
      "TSV_TO_BASE64",
      "BASE64_TO_TSV",
      "BINARY_TO_BASE64",
      "BASE64_TO_BINARY",
      "HEX_TO_BASE64",
      "BASE64_TO_HEX",
      "OCTAL_TO_BASE64",
    ],
  },
  {
    label: "Tokens",
    tools: ["JWT_DECODE"],
  },
];

/**
 * Single entry point for every transformation, manual or automatic.
 * Both views use this — the transformation engine lives in exactly one place.
 */
export function transform(
  mode: ToolMode,
  autoEnabled: boolean,
  input: string,
): TransformationResult {
  if (mode === AUTO_DETECT) {
    return autoEnabled ? autoTransform(input) : autoTransformOffResult(input);
  }
  return MANUAL_TOOLS[mode](input);
}

function autoTransformOffResult(input: string): TransformationResult {
  return {
    success: false,
    transformation: "NONE",
    inputType: "UNKNOWN",
    detectedType: "UNKNOWN",
    output: input,
    originalInput: input,
    message: "Auto Detect is off — pick a manual tool or re-enable Auto Detect.",
  };
}