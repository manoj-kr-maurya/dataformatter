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
import { jsonSorter } from "@/lib/transformers/jsonSorter";
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
import { jsonParser } from "@/lib/transformers/jsonParser";
import { jwtDecoder } from "@/lib/transformers/jwtDecoder";
import { octalToBase64 } from "@/lib/transformers/octalToBase64";
import { pngToBase64 } from "@/lib/transformers/pngToBase64";
import { tsvToBase64 } from "@/lib/transformers/tsvToBase64";
import { urlDecoder } from "@/lib/transformers/urlDecoder";
import { urlEncoder } from "@/lib/transformers/urlEncoder";
import { utf8Converter } from "@/lib/transformers/utf8Converter";
import { utf8Decoder } from "@/lib/transformers/utf8Decoder";
import { urlParser } from "@/lib/transformers/urlParser";
import { xmlParser } from "@/lib/transformers/xmlParser";
import { yamlParser } from "@/lib/transformers/yamlParser";
import { xmlToBase64 } from "@/lib/transformers/xmlToBase64";
import { xmlUrlDecoder } from "@/lib/transformers/xmlUrlDecoder";
import { xmlUrlEncoder } from "@/lib/transformers/xmlUrlEncoder";
import { yamlToBase64 } from "@/lib/transformers/yamlToBase64";
import {
  randomAlphanumericGenerator,
  randomBitmapGenerator,
  randomCsvGenerator,
  randomJsonGenerator,
  randomNamePicker,
  randomRegexGenerator,
  randomStringGenerator,
  randomTsvGenerator,
  randomXmlGenerator,
  shuffleLines,
} from "@/lib/transformers/randomTextData";
import {
  randomDecimalGenerator,
  randomFractionGenerator,
  randomIntegerGenerator,
  randomIntegerRangeGenerator,
  randomNumberGenerator,
  randomPrimeGenerator,
} from "@/lib/transformers/randomNumbers";
import {
  randomBinaryGenerator,
  randomByteGenerator,
  randomDateGenerator,
  randomHexGenerator,
  randomIp,
  randomMacGenerator,
  randomTimeGenerator,
  randomUuidGenerator,
} from "@/lib/transformers/randomValues";
import {
  binaryToStringConverter,
  hexToStringConverter,
  numberToWordsConverter,
  stringToBinaryConverter,
  stringToHexConverter,
  wordsToNumberConverter,
} from "@/lib/transformers/stringConvert";
import {
  caseConverter,
  delimitedTextExtractor,
  removeAccents,
  removeDuplicateLines,
  removeEmptyLines,
  removeExtraSpaces,
  removeLineBreaks,
  removeLinesContaining,
  removePunctuation,
  removeWhitespace,
  reverseString,
  sortTextLines,
  stringBuilder,
  textRepeater,
  upsideDownText,
  wordCounter,
  wordFrequencyCounter,
  wordRepeater,
  wordSorter,
} from "@/lib/transformers/stringClean";
import {
  ntlmHashGenerator,
  passwordGenerator,
  randomWordGenerator,
} from "@/lib/transformers/stringGenerate";
import {
  md5HashGenerator,
  sha1HashGenerator,
  sha224HashGenerator,
  sha256HashGenerator,
  sha384HashGenerator,
  sha512_224HashGenerator,
  sha512_256HashGenerator,
  sha512HashGenerator,
  sha3_224HashGenerator,
  sha3_256HashGenerator,
  sha3_384HashGenerator,
  sha3_512HashGenerator,
} from "@/lib/transformers/cryptoTools";

export const AUTO_DETECT = "AUTO_DETECT" as const;

export type Transformer = (input: string) => TransformationResult;

export const MANUAL_TOOLS: Record<ToolType, Transformer> = {
  JSON_FORMAT: jsonFormatter,
  JSON_MINIFY: jsonMinifier,
  SORT_KEYS: jsonSorter,
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
  URL_PARSE: urlParser,
  JSON_PARSE: jsonParser,
  XML_PARSE: xmlParser,
  YAML_PARSE: yamlParser,
  RANDOM_IP: randomIp,
  RANDOM_TIME: randomTimeGenerator,
  RANDOM_UUID: randomUuidGenerator,
  RANDOM_JSON: randomJsonGenerator,
  RANDOM_XML: randomXmlGenerator,
  RANDOM_REGEX: randomRegexGenerator,
  RANDOM_CSV: randomCsvGenerator,
  RANDOM_NUMBER: randomNumberGenerator,
  RANDOM_INTEGER: randomIntegerGenerator,
  RANDOM_PRIME: randomPrimeGenerator,
  RANDOM_DATE: randomDateGenerator,
  RANDOM_BITMAP: randomBitmapGenerator,
  RANDOM_NAME_PICKER: randomNamePicker,
  SHUFFLE_LINES: shuffleLines,
  RANDOM_MAC: randomMacGenerator,
  RANDOM_HEX: randomHexGenerator,
  RANDOM_TSV: randomTsvGenerator,
  RANDOM_STRING: randomStringGenerator,
  RANDOM_FRACTION: randomFractionGenerator,
  RANDOM_INTEGER_RANGE: randomIntegerRangeGenerator,
  RANDOM_BINARY: randomBinaryGenerator,
  RANDOM_BYTE: randomByteGenerator,
  RANDOM_DECIMAL: randomDecimalGenerator,
  RANDOM_ALPHANUMERIC: randomAlphanumericGenerator,
  UPSIDE_DOWN_TEXT: upsideDownText,
  RANDOM_WORD: randomWordGenerator,
  NTLM_HASH: ntlmHashGenerator,
  PASSWORD_GENERATOR: passwordGenerator,
  STRING_BUILDER: stringBuilder,
  NUMBER_TO_WORDS: numberToWordsConverter,
  WORDS_TO_NUMBER: wordsToNumberConverter,
  WORD_COUNTER: wordCounter,
  WORD_REPEATER: wordRepeater,
  REVERSE_STRING: reverseString,
  STRING_TO_HEX: stringToHexConverter,
  HEX_TO_STRING: hexToStringConverter,
  STRING_TO_BINARY: stringToBinaryConverter,
  BINARY_TO_STRING: binaryToStringConverter,
  CASE_CONVERTER: caseConverter,
  DELIMITED_TEXT_EXTRACTOR: delimitedTextExtractor,
  REMOVE_ACCENTS: removeAccents,
  REMOVE_DUPLICATE_LINES: removeDuplicateLines,
  REMOVE_EMPTY_LINES: removeEmptyLines,
  REMOVE_EXTRA_SPACES: removeExtraSpaces,
  REMOVE_WHITESPACE: removeWhitespace,
  REMOVE_LINE_BREAKS: removeLineBreaks,
  REMOVE_LINES_CONTAINING: removeLinesContaining,
  SORT_TEXT_LINES: sortTextLines,
  WORD_SORTER: wordSorter,
  WORD_FREQUENCY_COUNTER: wordFrequencyCounter,
  TEXT_REPEATER: textRepeater,
  REMOVE_PUNCTUATION: removePunctuation,
  MD5_HASH: md5HashGenerator,
  SHA1_HASH: sha1HashGenerator,
  SHA224_HASH: sha224HashGenerator,
  SHA256_HASH: sha256HashGenerator,
  SHA384_HASH: sha384HashGenerator,
  SHA512_HASH: sha512HashGenerator,
  SHA512_224_HASH: sha512_224HashGenerator,
  SHA512_256_HASH: sha512_256HashGenerator,
  SHA3_224_HASH: sha3_224HashGenerator,
  SHA3_256_HASH: sha3_256HashGenerator,
  SHA3_384_HASH: sha3_384HashGenerator,
  SHA3_512_HASH: sha3_512HashGenerator,
};

export const TOOL_META: Record<ToolType, { label: string; description: string }> = {
  JSON_FORMAT: { label: "JSON Format", description: "Prettify JSON with 2-space indentation." },
  JSON_MINIFY: { label: "JSON Minify", description: "Compress JSON into a single line." },
  SORT_KEYS: { label: "Sort JSON Keys", description: "Sort the keys of every JSON object alphabetically." },
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
  URL_PARSE: {
    label: "URL Parser",
    description: "Break a URL into protocol, host, path, query and parameters.",
  },
  JSON_PARSE: {
    label: "JSON Parser",
    description: "Parse JSON into a type-annotated tree.",
  },
  XML_PARSE: {
    label: "XML Parser",
    description: "Parse XML into an element tree with attributes and text.",
  },
  YAML_PARSE: {
    label: "YAML Parser",
    description: "Parse YAML into a JSON object.",
  },
  RANDOM_IP: {
    label: "Random IP Address",
    description: "Generate random IPv4 addresses.",
  },
  RANDOM_TIME: {
    label: "Random Time Generator",
    description: "Generate random times of day (HH:MM:SS).",
  },
  RANDOM_UUID: {
    label: "Random UUID Generator",
    description: "Generate random RFC 4122 UUIDs.",
  },
  RANDOM_JSON: {
    label: "Random JSON Generator",
    description: "Generate random JSON objects.",
  },
  RANDOM_XML: {
    label: "Random XML Generator",
    description: "Generate a random XML document.",
  },
  RANDOM_REGEX: {
    label: "Random Data from Regex",
    description: "Generate random data that matches a regex.",
  },
  RANDOM_CSV: {
    label: "Random CSV Generator",
    description: "Generate a CSV file of random words.",
  },
  RANDOM_NUMBER: {
    label: "Random Number Generator",
    description: "Generate random numbers.",
  },
  RANDOM_INTEGER: {
    label: "Random Integer Generator",
    description: "Generate random integers.",
  },
  RANDOM_PRIME: {
    label: "Random Prime Generator",
    description: "Generate random prime numbers.",
  },
  RANDOM_DATE: {
    label: "Random Date Generator",
    description: "Generate random ISO dates.",
  },
  RANDOM_BITMAP: {
    label: "Random Bitmap Generator",
    description: "Generate a grid of random bitmap pixels.",
  },
  RANDOM_NAME_PICKER: {
    label: "Random Name Picker",
    description: "Pick a random name from a comma/newline list.",
  },
  SHUFFLE_LINES: {
    label: "Text Lines Shuffler",
    description: "Randomly re-order the lines of your text.",
  },
  RANDOM_MAC: {
    label: "MAC Address Generator",
    description: "Generate random MAC addresses.",
  },
  RANDOM_HEX: {
    label: "Random Hex Generator",
    description: "Generate random hex strings.",
  },
  RANDOM_TSV: {
    label: "Random TSV Generator",
    description: "Generate a TSV file of random words.",
  },
  RANDOM_STRING: {
    label: "Random String Generator",
    description: "Generate random letter strings.",
  },
  RANDOM_FRACTION: {
    label: "Random Fraction Generator",
    description: "Generate random fractions.",
  },
  RANDOM_INTEGER_RANGE: {
    label: "Random Integer Range Generator",
    description: "Generate random integers within a range.",
  },
  RANDOM_BINARY: {
    label: "Random Binary Generator",
    description: "Generate random binary strings.",
  },
  RANDOM_BYTE: {
    label: "Random Byte Generator",
    description: "Generate random byte values.",
  },
  RANDOM_DECIMAL: {
    label: "Random Decimal Generator",
    description: "Generate random decimal numbers.",
  },
  RANDOM_ALPHANUMERIC: {
    label: "Random Alphanumeric Generator",
    description: "Generate random alphanumeric strings.",
  },
  UPSIDE_DOWN_TEXT: {
    label: "Upside Down Text",
    description: "Flip text upside down using Unicode upside-down characters.",
  },
  RANDOM_WORD: {
    label: "Random Word Generator",
    description: "Generate random words.",
  },
  NTLM_HASH: {
    label: "NTLM Hash Generator",
    description: "Generate the NTLM hash of a password (MD4 of UTF-16LE).",
  },
  PASSWORD_GENERATOR: {
    label: "Password Generator",
    description: "Generate strong random passwords.",
  },
  STRING_BUILDER: {
    label: "String Builder",
    description: "Join strings on the following lines with a separator on the first line.",
  },
  NUMBER_TO_WORDS: {
    label: "Number to Words",
    description: "Convert numbers into their English word form.",
  },
  WORDS_TO_NUMBER: {
    label: "Words to Number",
    description: "Convert English number words back into numbers.",
  },
  WORD_COUNTER: {
    label: "Word Counter",
    description: "Count the words, characters and lines in your text.",
  },
  WORD_REPEATER: {
    label: "Word Repeater",
    description: "Repeat every word a given number of times (leading number = count).",
  },
  REVERSE_STRING: {
    label: "Reverse String",
    description: "Reverse the characters in your text.",
  },
  STRING_TO_HEX: {
    label: "String to Hex",
    description: "Convert text into a hex dump of its UTF-8 bytes.",
  },
  HEX_TO_STRING: {
    label: "Hex to String",
    description: "Convert hex bytes back into UTF-8 text.",
  },
  STRING_TO_BINARY: {
    label: "String to Binary",
    description: "Convert text into 8-bit binary for each UTF-8 byte.",
  },
  BINARY_TO_STRING: {
    label: "Binary to String",
    description: "Convert 8-bit binary groups back into UTF-8 text.",
  },
  CASE_CONVERTER: {
    label: "Case Converter",
    description: "Convert case: prefix text with a style such as title, snake or kebab.",
  },
  DELIMITED_TEXT_EXTRACTOR: {
    label: "Delimited Text Extractor",
    description: "Extract text between start and end delimiters (delimiters on the first two lines).",
  },
  REMOVE_ACCENTS: {
    label: "Remove Accents",
    description: "Strip diacritics such as é, ñ and ü from your text.",
  },
  REMOVE_DUPLICATE_LINES: {
    label: "Remove Duplicate Lines",
    description: "Remove duplicated lines, keeping the first occurrence of each.",
  },
  REMOVE_EMPTY_LINES: {
    label: "Remove Empty Lines",
    description: "Remove blank lines from your text.",
  },
  REMOVE_EXTRA_SPACES: {
    label: "Remove Extra Spaces",
    description: "Collapse runs of spaces to a single space and trim lines.",
  },
  REMOVE_WHITESPACE: {
    label: "Remove Whitespace",
    description: "Remove all whitespace including spaces, tabs and newlines.",
  },
  REMOVE_LINE_BREAKS: {
    label: "Remove Line Breaks",
    description: "Replace newlines with a single space.",
  },
  REMOVE_LINES_CONTAINING: {
    label: "Remove Lines Containing",
    description: "Remove every line that contains a word (word on the first line).",
  },
  SORT_TEXT_LINES: {
    label: "Sort Text Lines",
    description: "Sort the lines of your text alphabetically.",
  },
  WORD_SORTER: {
    label: "Word Sorter",
    description: "Sort the words in your text alphabetically, one per line.",
  },
  WORD_FREQUENCY_COUNTER: {
    label: "Word Frequency Counter",
    description: "Count how often each word appears in your text.",
  },
  TEXT_REPEATER: {
    label: "Text Repeater",
    description: "Repeat text a given number of times (leading number = count).",
  },
  REMOVE_PUNCTUATION: {
    label: "Remove Punctuation",
    description: "Remove all punctuation and symbols from your text.",
  },
  MD5_HASH: {
    label: "MD5 Hash",
    description: "Compute the 128-bit MD5 digest of your text.",
  },
  SHA1_HASH: {
    label: "SHA-1 Hash",
    description: "Compute the 160-bit SHA-1 digest of your text.",
  },
  SHA224_HASH: {
    label: "SHA-224 Hash",
    description: "Compute the 224-bit SHA-224 digest of your text.",
  },
  SHA256_HASH: {
    label: "SHA-256 Hash",
    description: "Compute the 256-bit SHA-256 digest of your text.",
  },
  SHA384_HASH: {
    label: "SHA-384 Hash",
    description: "Compute the 384-bit SHA-384 digest of your text.",
  },
  SHA512_HASH: {
    label: "SHA-512 Hash",
    description: "Compute the 512-bit SHA-512 digest of your text.",
  },
  SHA512_224_HASH: {
    label: "SHA-512/224 Hash",
    description: "Compute the 224-bit SHA-512/224 digest of your text.",
  },
  SHA512_256_HASH: {
    label: "SHA-512/256 Hash",
    description: "Compute the 256-bit SHA-512/256 digest of your text.",
  },
  SHA3_224_HASH: {
    label: "SHA3-224 Hash",
    description: "Compute the 224-bit SHA-3 (Keccak) digest of your text.",
  },
  SHA3_256_HASH: {
    label: "SHA3-256 Hash",
    description: "Compute the 256-bit SHA-3 (Keccak) digest of your text.",
  },
  SHA3_384_HASH: {
    label: "SHA3-384 Hash",
    description: "Compute the 384-bit SHA-3 (Keccak) digest of your text.",
  },
  SHA3_512_HASH: {
    label: "SHA3-512 Hash",
    description: "Compute the 512-bit SHA-3 (Keccak) digest of your text.",
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

/** Parser tools shown on /parsers. */
export const PARSER_TOOL_ORDER: ToolType[] = [
  "URL_PARSE",
  "JSON_PARSE",
  "XML_PARSE",
  "YAML_PARSE",
];

/** Random generator tools shown on /random-generators. */
export const RANDOM_GENERATOR_TOOL_ORDER: ToolType[] = [
  "RANDOM_IP",
  "RANDOM_TIME",
  "RANDOM_UUID",
  "RANDOM_JSON",
  "RANDOM_XML",
  "RANDOM_REGEX",
  "RANDOM_CSV",
  "RANDOM_NUMBER",
  "RANDOM_INTEGER",
  "RANDOM_PRIME",
  "RANDOM_DATE",
  "RANDOM_BITMAP",
  "RANDOM_NAME_PICKER",
  "SHUFFLE_LINES",
  "RANDOM_MAC",
  "RANDOM_HEX",
  "RANDOM_TSV",
  "RANDOM_STRING",
  "RANDOM_FRACTION",
  "RANDOM_INTEGER_RANGE",
  "RANDOM_BINARY",
  "RANDOM_BYTE",
  "RANDOM_DECIMAL",
  "RANDOM_ALPHANUMERIC",
];

/** String utility tools shown on /string-functions. */
export const STRING_FUNCTION_TOOL_ORDER: ToolType[] = [
  "UPSIDE_DOWN_TEXT",
  "RANDOM_WORD",
  "NTLM_HASH",
  "PASSWORD_GENERATOR",
  "STRING_BUILDER",
  "NUMBER_TO_WORDS",
  "WORDS_TO_NUMBER",
  "WORD_COUNTER",
  "WORD_REPEATER",
  "REVERSE_STRING",
  "STRING_TO_HEX",
  "HEX_TO_STRING",
  "STRING_TO_BINARY",
  "BINARY_TO_STRING",
  "CASE_CONVERTER",
  "DELIMITED_TEXT_EXTRACTOR",
  "REMOVE_ACCENTS",
  "REMOVE_DUPLICATE_LINES",
  "REMOVE_EMPTY_LINES",
  "REMOVE_EXTRA_SPACES",
  "REMOVE_WHITESPACE",
  "REMOVE_LINE_BREAKS",
  "REMOVE_LINES_CONTAINING",
  "SORT_TEXT_LINES",
  "WORD_SORTER",
  "WORD_FREQUENCY_COUNTER",
  "TEXT_REPEATER",
  "REMOVE_PUNCTUATION",
];

/** Hash tools shown on /cryptography-tools. */
export const CRYPTOGRAPHY_TOOL_ORDER: ToolType[] = [
  "MD5_HASH",
  "SHA1_HASH",
  "SHA224_HASH",
  "SHA256_HASH",
  "SHA384_HASH",
  "SHA512_HASH",
  "SHA512_224_HASH",
  "SHA512_256_HASH",
  "SHA3_224_HASH",
  "SHA3_256_HASH",
  "SHA3_384_HASH",
  "SHA3_512_HASH",
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
  ...PARSER_TOOL_ORDER,
  ...RANDOM_GENERATOR_TOOL_ORDER,
  ...STRING_FUNCTION_TOOL_ORDER,
  ...CRYPTOGRAPHY_TOOL_ORDER,
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
    tools: ["JSON_FORMAT", "JSON_MINIFY", "SORT_KEYS"],
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
    label: "Parsers",
    tools: ["URL_PARSE", "JSON_PARSE", "XML_PARSE", "YAML_PARSE"],
  },
  {
    label: "Random Tools",
    tools: [
      "RANDOM_IP",
      "RANDOM_TIME",
      "RANDOM_UUID",
      "RANDOM_JSON",
      "RANDOM_XML",
      "RANDOM_REGEX",
      "RANDOM_CSV",
      "RANDOM_NUMBER",
      "RANDOM_INTEGER",
      "RANDOM_PRIME",
      "RANDOM_DATE",
      "RANDOM_BITMAP",
      "RANDOM_NAME_PICKER",
      "SHUFFLE_LINES",
      "RANDOM_MAC",
      "RANDOM_HEX",
      "RANDOM_TSV",
      "RANDOM_STRING",
      "RANDOM_FRACTION",
      "RANDOM_INTEGER_RANGE",
      "RANDOM_BINARY",
      "RANDOM_BYTE",
      "RANDOM_DECIMAL",
      "RANDOM_ALPHANUMERIC",
    ],
  },
  {
    label: "String Functions",
    tools: [
      "UPSIDE_DOWN_TEXT",
      "RANDOM_WORD",
      "NTLM_HASH",
      "PASSWORD_GENERATOR",
      "STRING_BUILDER",
      "NUMBER_TO_WORDS",
      "WORDS_TO_NUMBER",
      "WORD_COUNTER",
      "WORD_REPEATER",
      "REVERSE_STRING",
      "STRING_TO_HEX",
      "HEX_TO_STRING",
      "STRING_TO_BINARY",
      "BINARY_TO_STRING",
      "CASE_CONVERTER",
      "DELIMITED_TEXT_EXTRACTOR",
      "REMOVE_ACCENTS",
      "REMOVE_DUPLICATE_LINES",
      "REMOVE_EMPTY_LINES",
      "REMOVE_EXTRA_SPACES",
      "REMOVE_WHITESPACE",
      "REMOVE_LINE_BREAKS",
      "REMOVE_LINES_CONTAINING",
      "SORT_TEXT_LINES",
      "WORD_SORTER",
      "WORD_FREQUENCY_COUNTER",
      "TEXT_REPEATER",
      "REMOVE_PUNCTUATION",
    ],
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
    label: "Cryptography",
    tools: [
      "MD5_HASH",
      "SHA1_HASH",
      "SHA224_HASH",
      "SHA256_HASH",
      "SHA384_HASH",
      "SHA512_HASH",
      "SHA512_224_HASH",
      "SHA512_256_HASH",
      "SHA3_224_HASH",
      "SHA3_256_HASH",
      "SHA3_384_HASH",
      "SHA3_512_HASH",
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