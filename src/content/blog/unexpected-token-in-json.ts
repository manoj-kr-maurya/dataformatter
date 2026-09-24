import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "unexpected-token-in-json",
  title: "Unexpected Token in JSON: What It Means and How to Fix It",
  description:
    "'Unexpected token' is JavaScript's way of naming the exact character that broke JSON.Parse. Here's what modern V8, Firefox and Safari report, the most common causes, and how the validator points to the fix.",
  h1: "Unexpected Token in JSON: What It Means and How to Fix It",
  category: "Debugging",
  excerpt:
    "Every 'Unexpected token' message names the character that stopped parsing. Learn what Chrome, Firefox and Safari each say, why trailing commas and HTML pages cause it, and how to find the fix fast.",
  geo: {
    what: "An 'Unexpected token' error is what JavaScript throws when JSON.parse meets a character it doesn't expect — the message names that token, so the position it points at marks exactly where the grammar broke.",
    who: "Developers debugging malformed API responses, config files or webhook payloads that fail to parse, and who want to interpret the engine error instead of guessing.",
    different: "The JSON Validator runs the same parse with precise line-and-column output, so the fix is found in one click instead of eyeballing a long error string.",
  },
  publishedAt: "2026-09-24",
  relatedToolPaths: ["/json-validator", "/json-formatter", "/json-minifier", "/json-diff"],
  relatedSlugs: ["how-json-formatter-works", "how-to-read-a-stack-trace"],
  blocks: [
    {
      type: "p",
      text: "'Unexpected token' is the message you get when JavaScript's JSON.parse stops at a character it wasn't expecting to see. It reads like a roadblock sign: the parser was moving along and hit something it couldn't consume. The good news is the message names the token and the position — so the error is telling you exactly where to look.",
    },
    {
      type: "glossary",
      terms: [
        {
          term: "JSON.parse",
          definition: "The JavaScript standard-library function that converts a JSON string into a JavaScript value, throwing a SyntaxError when the input isn't valid JSON.",
        },
        {
          term: "Token",
          definition: "The smallest meaningful unit a parser reads — a brace, bracket, quote, comma, colon, or a literal like true. 'Unexpected token' names the token the parser rejected.",
        },
        {
          term: "Trailing comma",
          definition: "A comma after the last element of an object or array. Legal in JavaScript objects and most JS arrays, but forbidden everywhere in JSON.",
        },
        {
          term: "Parser position",
          definition: "The character offset and line/column the parser had reached when it failed — the reference point for the malformed construct.",
        },
      ],
    },
    {
      type: "h2",
      text: "What the message actually tells you",
    },
    {
      type: "p",
      text: "The phrase 'Unexpected token X' means: I was expecting a valid JSON token here, and I found X instead. When X is a quote, the failure is quoting; when X is a brace or bracket, it's structure; when X is an identifier like <, you're parsing something that isn't JSON at all.",
    },
    {
      type: "h2",
      text: "Modern engines, newer messages",
    },
    {
      type: "p",
      text: "Since Chrome 123, V8 reports messages like Unexpected token '<', \"<html>…\" is not valid JSON — quoting the offending string so you can see the context at a glance. Firefox says JSON.parse: unexpected character at line … column … of the JSON data, and Safari says JSON Parse error: Unexpected token … without extra context. Each engine phrases the same failure slightly differently.",
    },
    {
      type: "table",
      caption: "How engines phrase JSON syntax errors",
      headers: ["Engine", "Message shape", "Example trigger"],
      rows: [
        ["Chrome / V8", "Unexpected token '…', \"…\" is not valid JSON", "Pasting HTML as the payload"],
        ["Firefox", "JSON.parse: expected property name or '}' at line 1 column 2 of the JSON data", "Missing quote on a key"],
        ["Safari", "JSON Parse error: Unexpected token '<'", "HTML error page as payload"],
      ],
    },
    {
      type: "h2",
      text: "The most common causes",
    },
    {
      type: "ul",
      items: [
        "Trailing comma: { \"a\": 1, } or [1, 2,] — fine in most JavaScript, invalid in JSON.",
        "Single quotes: keys and strings that use ' instead of \".",
        "Unquoted keys: { name: \"Ada\" } instead of { \"name\": \"Ada\" }.",
        "Comments or NaN, Infinity, undefined — constructs JSON doesn't allow.",
        "HTML or an error page where the JSON response should be — check the content type.",
      ],
    },
    {
      type: "h2",
      text: "Fixing trailing commas",
    },
    {
      type: "p",
      text: "A trailing comma usually appears on the last property or element. Because the parser reports the position just after the comma, the fix is almost always one line above the reported position — delete the comma on the previous line.",
    },
    {
      type: "example",
      inputLabel: "Broken",
      input: `{
  "name": "John",
  "age": 30,
}`,
      outputLabel: "Fixed",
      output: `{
  "name": "John",
  "age": 30
}`,
    },
    {
      type: "h2",
      text: "Fixing 'HTML where JSON should be'",
    },
    {
      type: "p",
      text: "Unexpected token '<' with HTML in the message means the endpoint returned a document — a login wall, a 404 page or a CDN error — instead of JSON. No amount of JSON editing fixes this: verify the request with the API Client or Header Inspector, follow redirects, and confirm the Content-Type is application/json.",
    },
    {
      type: "h2",
      text: "Using the validator to pinpoint the failure",
    },
    {
      type: "ol",
      items: [
        "Paste the failing document into the JSON Validator.",
        "Read the report: it gives the line and column of the exact offender.",
        "Click the reported location to jump the editor to the character.",
        "Fix, re-validate, then format or minify the clean result.",
      ],
    },
    {
      type: "note",
      title: "Read one character before the position",
      text: "Most unexpected tokens sit one character after the true mistake: a trailing comma leaves the parser stranded at the closing brace, and a missing quote strands it at the following colon. Check just before the reported token first.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Why does JSON.parse reject things my JavaScript accepts?",
          a: "JSON is a strict data interchange format: no single quotes, no unquoted keys, no trailing commas, no comments, no NaN or undefined. JavaScript objects allow all of these, which is exactly why a validator exists.",
        },
        {
          q: "Why do the error messages differ between browsers?",
          a: "Each engine implements its own JSON parser and reporting format. Chrome quotes the offending string, Firefox names line and column, Safari is terse. The underlying grammar rules are identical.",
        },
        {
          q: "How do I find the position in a long minified document?",
          a: "Paste it into the JSON Validator, which reports line and column, then click to jump. Formatting first with the JSON Formatter makes structure errors visible even before validation.",
        },
        {
          q: "What does Unexpected token '<' with HTML in it mean?",
          a: "The response body starts with a tag like <html> — the endpoint returned a document instead of JSON. Check the status code, redirects and Content-Type with the API Client.",
        },
      ],
    },
  ],
};

export default article;