import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "what-makes-an-api-change-breaking",
  title: "What Makes an API Change Breaking? A Field-by-Field Guide",
  description:
    "Breaking vs non-breaking API changes: removing fields, new required fields, enum removals, type tightenings, object-to-array flips and nullable transitions — classified like a real detector does.",
  h1: "What Makes an API Change Breaking? A Field-by-Field Guide",
  category: "API Engineering",
  excerpt:
    "An API change is breaking when existing clients can no longer parse, validate or safely navigate the response. Some breaks are obvious; a few are genuinely surprising — and a good detector gets both right.",
  geo: {
    what: "An API change is breaking when it stops existing clients from validating or reading the response — for example a removed field, a newly required field, an enum value deletion or a type change that drops accepted input.",
    who: "Backend and integration developers reviewing release branches or third-party API upgrades before they ship.",
    different: "The API Breaking Change Detector classifies every structural difference as breaking, potentially-breaking, non-breaking or informational, using schema-aware heuristics (new required fields, enum removals and shape flips count as breaking).",
  },
  publishedAt: "2026-08-12",
  relatedToolPaths: ["/api-diff", "/json-diff", "/openapi", "/json-to-schema"],
  relatedSlugs: ["openapi-3-0-vs-3-1", "how-json-diff-works"],
  blocks: [
    {
      type: "p",
      text: "Each difference between an old and a new API document lands in one of four buckets. Breaking changes must be treated as breaking releases (or converted into additive changes). Non-breaking changes can ship safely. Potentially-breaking ones need a human call, and informational ones describe value changes rather than shape changes. The detector applies a fixed rule set to every diff; the rules below are exactly the ones it implements.",
    },
    {
      type: "glossary",
      terms: [
        {
          term: "Breaking",
          definition: "Existing clients will fail to validate, parse or navigate the new response without changes — removed fields, added required fields, removed enum values and type tightenings.",
        },
        {
          term: "Potentially-breaking",
          definition: "Breakage depends on the client's assumptions — array element removal at a position, a value becoming null, or a null value becoming real.",
        },
        {
          term: "Non-breaking",
          definition: "Existing, spec-compliant clients keep working — adding an optional field, relaxing a required constraint, adding an enum value or widening a type.",
        },
        {
          term: "Informational",
          definition: "A factual change in values — scalar value changes, nested structure movement that is better understood at the field level, or array element additions.",
        },
      ],
    },
    {
      type: "h2",
      text: "Clear-cut breaking changes",
    },
    {
      type: "ul",
      items: [
        "Removing a field — clients that read the previously returned key now get undefined; type-checked serializers can fail at compile time.",
        "Adding a field to the required list (for schema-style documents) — existing payloads that omit it will fail validation.",
        "Removing a value from an enum — inputs using the deleted value are rejected outright.",
        "Tightening a type, including making a nullable value non-null — the set of acceptable values shrinks.",
        "Object-to-array (or vice versa) — a container shape flip is near-certain breakage.",
      ],
    },
    {
      type: "code",
      label: "An object that became an array",
      code: `// before:  "tags": { "primary": "js" }
// after:   "tags": ["js"]            ← breaking`,
    },
    {
      type: "h2",
      text: "Surprisingly non-breaking changes",
    },
    {
      type: "ul",
      items: [
        "Adding a field that is not required — clients that ignore unknown fields are safe.",
        "Removing a field from a required list — 'was required, now optional' is a relaxation.",
        "Adding a new enum value — existing allowed inputs stay valid.",
        "Widening a type, such as accepting null where only a string was allowed before.",
      ],
    },
    {
      type: "h2",
      text: "The tricky middle",
    },
    {
      type: "p",
      text: "Some changes depend on the client. A value becoming null (or a null becoming a real value) is flagged potentially-breaking because it only breaks clients that never expected the other side. Removing an element from an array is also potentially-breaking — the element at a given index may have been meaningful, so later elements shift. Scalar value changes are informational by default, unless the value is contractual like a version string or a feature-flag default.",
    },
    {
      type: "h2",
      text: "Schema-aware comparison",
    },
    {
      type: "p",
      text: "The detector is more useful on schemas because it can tell required from optional. It recognizes schema-style documents when the root carries type, properties, items, required or enum, and then interprets changes in context: a new entry inside a required list is breaking, an entry removed from it is a relaxation, and a change to an enum's contents is judged by whether values were added or deleted. Plain response samples get the same diff, minus the required/enum context.",
    },
    {
      type: "note",
      title: "Heuristics, not guarantees",
      text: "These classifications are observations about the shape — the detector cannot know your clients' assumptions. Treat 'non-breaking' as safe for spec-compliant clients that ignore unknown fields, and confirm 'potentially-breaking' items manually.",
    },
    {
      type: "h2",
      text: "The shape-flip radar",
    },
    {
      type: "p",
      text: "Because an object-to-array flip produces a cascade of confusing field-level additions and removals, the detector runs a separate coarse scan that reports the flip itself as a single breaking headline, then suppresses the field-level noise underneath it — you see one clear signal instead of a wall of secondary changes.",
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Paste the previous and current versions of your API response or schema into the API Breaking Change Detector to get every change sorted breaking-first, with the exact path and before/after values.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is removing an optional field breaking?",
          a: "Yes — clients that read that field today will receive undefined tomorrow. That is exactly why the detector marks removed fields (outside required lists) as breaking.",
        },
        {
          q: "Is adding a field always safe?",
          a: "Adding an optional field is non-breaking for clients that ignore unknown fields. Adding a required field is breaking — existing payloads will no longer validate.",
        },
        {
          q: "Why is a value becoming null only potentially breaking?",
          a: "A client that handles null keeps working; one that assumes a concrete type does not. The detector cannot know which, so it flags the change for review instead of guessing.",
        },
      ],
    },
  ],
};

export default article;