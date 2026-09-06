import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "how-json-diff-works",
  title: "How JSON Diff Finds Added and Removed Fields",
  description:
    "Inside DataFormatter's JSON Diff: a recursive structural walk, key-set comparison for objects, positional comparison for arrays, canonical equality via JSON.stringify, and dot-path change reports.",
  h1: "How JSON Diff Finds Added and Removed Fields",
  category: "Data Formats",
  excerpt:
    "Diffs between two JSON documents are produced by a recursive structural walk that compares objects by key set, arrays by position, and every value by its canonical serialization.",
  geo: {
    what: "DataFormatter's JSON Diff is a browser-only tool that compares two JSON documents with a recursive structural walk and reports added, removed and changed values as precise dot paths.",
    who: "Developers reviewing changes to an API response, config file or data contract between two versions.",
    different: "Objects are compared by key set (order-independent) while arrays are compared positionally, equality is decided by canonical serialization, and results are reported as exact dot paths with before/after values.",
  },
  publishedAt: "2026-08-06",
  relatedToolPaths: ["/json-diff", "/json-formatter", "/json-validator", "/api-diff"],
  relatedSlugs: ["how-json-formatter-works", "what-makes-an-api-change-breaking"],
  blocks: [
    {
      type: "p",
      text: "A JSON diff answers a deceptively simple question: what changed between two documents? The interesting part is deciding what 'changed' means. The tool walks both documents in parallel, emitting one change per difference, and each change carries a path — like $.user.email — that says exactly where it happened.",
    },
    {
      type: "h2",
      text: "Objects: comparison by key set",
    },
    {
      type: "p",
      text: "For two objects, the diff first computes the set of keys on each side. Keys present in the old document but missing from the new one are 'removed'; keys new to the second document are 'added'. Keys present in both are compared recursively. Because comparison is driven by key sets, the order in which keys appear never matters — { \"a\": 1, \"b\": 2 } and { \"b\": 2, \"a\": 1 } are equal, exactly as JSON semantics intend.",
    },
    {
      type: "h2",
      text: "Arrays: comparison by position",
    },
    {
      type: "p",
      text: "Arrays are different. There are no keys to match, so elements are compared positionally: index 0 against index 0, index 1 against index 1, and so on across the longer of the two arrays. For indices past either end the diff emits an 'added' or 'removed' entry, which is why inserting an element near the start of an array can surface as many changes — every subsequent index shifts.",
    },
    {
      type: "h2",
      text: "Canonical equality",
    },
    {
      type: "p",
      text: "Two values are 'equal' when their canonical serializations match: JSON.stringify(value). That means 1 and 1.0 are equal (both serialize to \"1\"), while the number 1 and the string \"1\" are different (they serialize to \"1\" and \"\\\"1\\\"\") — a distinction hand-rolled comparison logic frequently gets wrong.",
    },
    {
      type: "h2",
      text: "Reading the change list",
    },
    {
      type: "p",
      text: "Every change is one of three kinds: added, removed or changed. Paths use dot notation for identifier-like keys and bracket notation otherwise, and values are shown compacted to a single line — truncated at 200 characters so huge objects stay readable.",
    },
    {
      type: "example",
      inputLabel: "Before",
      input: `{
  "user": { "id": 42, "name": "Ada" },
  "langs": ["js", "go"]
}`,
      outputLabel: "After",
      output: `{
  "user": { "name": "Ada", "email": "ada@example.com" },
  "langs": ["js", "go", "rust"]
}`,
    },
    {
      type: "code",
      label: "Reported changes",
      code: `- removed  $.user.id
+ added    $.user.email
+ added    $.langs[2]`,
    },
    {
      type: "h2",
      text: "How parse failures are handled",
    },
    {
      type: "p",
      text: "Both documents are parsed before any comparison starts, via JSON.parse with error-position extraction. If either side fails, the diff reports which side failed and the 1-based line of the first problem (converted from the parser's character offset) instead of producing a misleading partial diff.",
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Paste two JSON documents into the JSON Diff tool to get the precise, deduplicated change list with before and after values — no server round trip.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is the diff order-sensitive?",
          a: "For objects, no — keys are compared as sets, so reordering keys never counts as a change. For arrays, yes — elements are compared positionally, so shifting elements surfaces as changes.",
        },
        {
          q: "How are large values shown?",
          a: "Before and after cells are compacted to a single line and truncated at 200 characters with an ellipsis, so the change list stays scannable.",
        },
        {
          q: "Why is 1.0 not a change from 1?",
          a: "Equality uses canonical serialization — JSON.stringify(1) and JSON.stringify(1.0) are both \"1\". The string \"1\" is a different value and is correctly reported as changed.",
        },
      ],
    },
  ],
};

export default article;