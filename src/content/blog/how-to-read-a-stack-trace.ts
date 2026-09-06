import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "how-to-read-a-stack-trace",
  title: "How to Read a Stack Trace: Exception Types, Frames and Call Chains",
  description:
    "Read any stack trace with confidence: anatomy of exception banner and frames, JavaScript/Node, Java, Python and Go trace formats, and how a parser normalizes them into a clean call chain.",
  h1: "How to Read a Stack Trace: Exception Types, Frames and Call Chains",
  category: "Debugging",
  excerpt:
    "A stack trace is the call path at the moment of failure: the exception type and message up top, then one frame per function, each with a file and line. Read it top-down, then jump to the first frame in your code.",
  geo: {
    what: "A stack trace records the chain of function calls at the moment a program threw: an exception banner (type plus message) followed by one frame per call, each naming a function, file and line.",
    who: "Developers debugging exceptions, panics and crashes in JavaScript, Java, Python or Go who need the failing call path fast.",
    different: "The Stack Trace Reader detects the language automatically, extracts the exception and the first project frame, and folds noisy framework/async frames into a clean call chain — local and deterministic.",
  },
  publishedAt: "2026-08-24",
  relatedToolPaths: ["/stack-trace", "/error-workspace", "/log-analyzer", "/regex"],
  relatedSlugs: ["http-headers-developers-should-know", "what-makes-an-api-change-breaking"],
  blocks: [
    {
      type: "p",
      text: "A stack trace is recorded at the exact moment an exception unwinds, so it is the single most direct evidence a failure ships with. The useful reading order is: identify the exception type and message, then find the first frame written by your own code, and work outward from there.",
    },
    {
      type: "glossary",
      terms: [
        {
          term: "Exception banner",
          definition: "The first line(s): the exception type and its human-readable message — for example NullPointerException: Cannot invoke \"String.length()\" because \"s\" is null.",
        },
        {
          term: "Frame",
          definition: "One entry in the trace: a function name, a file, and a line number. The topmost frame is where the throw happened.",
        },
        {
          term: "Origin frame",
          definition: "The first frame that lives in the application's own code rather than in a framework, library or runtime internals.",
        },
        {
          term: "Call chain",
          definition: "The simplified, deduplicated list of functions that were active when the failure occurred — the readable version of the trace.",
        },
      ],
    },
    {
      type: "h2",
      text: "JavaScript / Node (V8)",
    },
    {
      type: "p",
      text: "A V8 trace lists frames as 'at fn (file:line)' in reverse call order, with the deepest call printed first. Internal runtime frames (node:internal/…) are marked as such so you can skip them. The exception type and message are the banner line at the top.",
    },
    {
      type: "code",
      label: "Node.js trace",
      code: `TypeError: Cannot read properties of undefined (reading 'name')
    at parseUser (src/api/parse.js:12)
    at handler (src/api/handler.js:8)
    at node:internal/process/task_queues:97:5`,
    },
    {
      type: "h2",
      text: "Java and JVM languages",
    },
    {
      type: "p",
      text: "Java traces start with an exception banner — often 'Exception in thread \"main\" java.lang…' — and list 'at' frames with fully qualified class names, so package ambiguity is rare. The trailing 'at App.main(App.java:12)' is where the throw began.",
    },
    {
      type: "code",
      label: "Java trace",
      code: `Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "user" is null
    at com.example.ApiClient.fetch(ApiClient.java:120)
    at com.example.App.main(App.java:12)`,
    },
    {
      type: "h2",
      text: "Python",
    },
    {
      type: "p",
      text: "Python prints 'Traceback (most recent call last)' first, then File and line entries in call order (oldest to newest), and finally the exception type and message on its own line. Read the last File entry for the origin.",
    },
    {
      type: "code",
      label: "Python trace",
      code: `Traceback (most recent call last):
  File "/app/main.py", line 20, in <module>
    fetch_orders(api)
  File "/app/client.py", line 44, in fetch_orders
    return response.json()["orders"]
KeyError: 'orders'`,
    },
    {
      type: "h2",
      text: "Go",
    },
    {
      type: "p",
      text: "Go panics report panic: <runtime error> plus a goroutine header, and frames that reverse read cleanly: 'file.go:line +0x48 funcName(...)'. The first application frame after the goroutine header is your origin.",
    },
    {
      type: "code",
      label: "Go panic",
      code: `panic: runtime error: index out of range [3] with length 3

goroutine 1 [running]:
main.sumValues(0xc000108008, 0x3, 0x0, 0x0)
    /app/main.go:21 +0x7d
main.main()
    /app/main.go:9 +0x39`,
    },
    {
      type: "h2",
      text: "Read it in this order",
    },
    {
      type: "ol",
      items: [
        "Exception type and message: what actually went wrong, in one line.",
        "The origin frame: the first frame that is your code, not node:internal, a framework or stdlib.",
        "The frames above it identify the immediate caller; everything below is context.",
        "Cross-check the failing input — the payload, headers or argument at that line — to turn the where into a why.",
      ],
    },
    {
      type: "note",
      title: "Traces are intentionally lossy",
      text: "Frameworks interleave promises, goroutines and async machinery into traces, making the raw output noisy. The parser is deliberately lossy by design: it normalizes repeated frames and builds a deduplicated top-down call chain. The goal is a readable summary, not a byte-perfect reconstruction.",
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Paste a Java, JavaScript/Node, Python or Go trace into the Stack Trace Reader for automatic language detection, the exception type and message, the origin location, and a clean call chain. Pair it with the Error Workspace to correlate the trace with logs and the failing request.",
    },
    {
      type: "faq",
      items: [
        {
          q: "What languages does the reader support?",
          a: "Java (and C#/Dart-style banners), JavaScript/Node (V8), Python and Go are detected automatically; unknown formats fall back to a best-effort fingerprint.",
        },
        {
          q: "Why does the parser drop or deduplicate frames?",
          a: "Real traces are full of repeated async/framework frames that do not help. The parser keeps the exception, the origin location and a clean chain of unique function names.",
        },
        {
          q: "What is the 'first project frame'?",
          a: "The first frame pointing at your application code rather than runtime internals or libraries — usually the frame that should anchor your bug hunt.",
        },
      ],
    },
  ],
};

export default article;