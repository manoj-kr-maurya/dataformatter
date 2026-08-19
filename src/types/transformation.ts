export type DetectedType = "JSON" | "BASE64" | "JWT" | "TEXT" | "UNKNOWN";

export type TransformationKind =
  | "NONE"
  | "JSON_FORMAT"
  | "JSON_MINIFY"
  | "JSON_VALIDATE"
  | "JSON_ENCODE"
  | "JSON_DECODE"
  | "BASE32_ENCODE"
  | "BASE32_DECODE"
  | "BASE58_ENCODE"
  | "BASE58_DECODE"
  | "BASE64_ENCODE"
  | "BASE64_DECODE"
  | "BASE64_TO_JSON"
  | "JSON_TO_BASE64"
  | "IMAGE_TO_BASE64"
  | "BASE64_TO_IMAGE"
  | "PNG_TO_BASE64"
  | "JPG_TO_BASE64"
  | "XML_TO_BASE64"
  | "YAML_TO_BASE64"
  | "BASE64_TO_XML"
  | "BASE64_TO_YAML"
  | "CSV_TO_BASE64"
  | "BASE64_TO_CSV"
  | "TSV_TO_BASE64"
  | "BASE64_TO_TSV"
  | "BINARY_TO_BASE64"
  | "BASE64_TO_BINARY"
  | "HEX_TO_BASE64"
  | "BASE64_TO_HEX"
  | "OCTAL_TO_BASE64"
  | "JSON_TO_JAVA"
  | "JSON_TO_XML"
  | "JSON_TO_YAML"
  | "JSON_TO_CSV"
  | "JSON_TO_TSV"
  | "JSON_TO_TEXT"
  | "JSON_TO_EXCEL"
  | "JSON_TO_HTML"
  | "JWT_DECODE"
  | "URL_ENCODE"
  | "URL_DECODE"
  | "JSON_URL_ENCODE"
  | "JSON_URL_DECODE"
  | "HTML_ENCODE"
  | "HTML_DECODE"
  | "XML_URL_ENCODE"
  | "XML_URL_DECODE"
  | "UTF8_ENCODE"
  | "UTF8_DECODE"
  | "HEX_TO_UTF8"
  | "URL_PARSE"
  | "JSON_PARSE"
  | "XML_PARSE"
  | "YAML_PARSE"
  | "RANDOM_IP"
  | "RANDOM_TIME"
  | "RANDOM_UUID"
  | "RANDOM_JSON"
  | "RANDOM_XML"
  | "RANDOM_REGEX"
  | "RANDOM_CSV"
  | "RANDOM_NUMBER"
  | "RANDOM_INTEGER"
  | "RANDOM_PRIME"
  | "RANDOM_DATE"
  | "RANDOM_BITMAP"
  | "RANDOM_NAME_PICKER"
  | "SHUFFLE_LINES"
  | "RANDOM_MAC"
  | "RANDOM_HEX"
  | "RANDOM_TSV"
  | "RANDOM_STRING"
  | "RANDOM_FRACTION"
  | "RANDOM_INTEGER_RANGE"
  | "RANDOM_BINARY"
  | "RANDOM_BYTE"
  | "RANDOM_DECIMAL"
  | "RANDOM_ALPHANUMERIC"
  | "UPSIDE_DOWN_TEXT"
  | "RANDOM_WORD"
  | "NTLM_HASH"
  | "PASSWORD_GENERATOR"
  | "STRING_BUILDER"
  | "NUMBER_TO_WORDS"
  | "WORDS_TO_NUMBER"
  | "WORD_COUNTER"
  | "WORD_REPEATER"
  | "REVERSE_STRING"
  | "STRING_TO_HEX"
  | "HEX_TO_STRING"
  | "STRING_TO_BINARY"
  | "BINARY_TO_STRING"
  | "CASE_CONVERTER"
  | "DELIMITED_TEXT_EXTRACTOR"
  | "REMOVE_ACCENTS"
  | "REMOVE_DUPLICATE_LINES"
  | "REMOVE_EMPTY_LINES"
  | "REMOVE_EXTRA_SPACES"
  | "REMOVE_WHITESPACE"
  | "REMOVE_LINE_BREAKS"
  | "REMOVE_LINES_CONTAINING"
  | "SORT_TEXT_LINES"
  | "WORD_SORTER"
  | "WORD_FREQUENCY_COUNTER"
  | "TEXT_REPEATER"
  | "REMOVE_PUNCTUATION"
  | "MD5_HASH"
  | "SHA1_HASH"
  | "SHA224_HASH"
  | "SHA256_HASH"
  | "SHA384_HASH"
  | "SHA512_HASH"
  | "SHA512_224_HASH"
  | "SHA512_256_HASH"
  | "SHA3_224_HASH"
  | "SHA3_256_HASH"
  | "SHA3_384_HASH"
  | "SHA3_512_HASH";

/**
 * Generic, UI-independent result produced by every transformation —
 * both the auto-detection pipeline and the manual tools.
 */
export interface TransformationResult {
  success: boolean;
  /** What kind of transformation was applied (NONE = no change). */
  transformation: TransformationKind;
  /** What the user actually pasted/typed. */
  inputType: DetectedType;
  /** What the produced output looks like. */
  detectedType: DetectedType;
  /** Resulting text. For errors this equals the original input unchanged. */
  output: string;
  /** The exact input the transformation was applied to. */
  originalInput: string;
  /** Human readable status message, colour + prepended icon by the UI. */
  message: string;
  /** Optional parser error location — lets the UI offer "Go to error". */
  errorLine?: number;
  errorColumn?: number;
  /** 1-based character offset of the error, when known. */
  errorPosition?: number;
}

export interface TransformState {
  result: TransformationResult | null;
  isProcessing: boolean;
}