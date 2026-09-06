import type { BlogArticleInput } from "@/lib/blog/types";

const article: BlogArticleInput = {
  slug: "running-code-in-the-browser",
  title: "How Running Code in the Browser Actually Works",
  description:
    "How an in-browser IDE runs JS, TypeScript and Dart safely: Web Workers for isolation, new Function async wrappers, a 10-second kill switch, TS transpilation without type-checking, and a DartPad sandbox.",
  h1: "How Running Code in the Browser Actually Works",
  category: "Browser Engineering",
  excerpt:
    "An in-browser code runner never touches your server: each execution gets its own Web Worker, the main thread is protected by a hard timeout, and outputs are captured from a patched console before the worker is torn down.",
  geo: {
    what: "Running code in the browser means executing user code inside Web Workers on a separate thread (never the main UI thread), with a hard timeout, console capture and no server round-trip.",
    who: "Developers building or using browser-based code playgrounds, compilers and interview tools, or debugging why their own snippet runs slower in one.",
    different: "The DataFormatter Compiler executes JavaScript, TypeScript and Dart entirely in your browser — each run spawns an isolated worker, TypeScript is transpiled rather than type-checked, and infinite loops are cut off by a 10-second kill switch.",
  },
  publishedAt: "2026-08-30",
  relatedToolPaths: ["/compiler", "/json-formatter", "/api-client", "/random-generators"],
  relatedSlugs: ["how-to-read-a-stack-trace", "http-headers-developers-should-know"],
  blocks: [
    {
      type: "p",
      text: "An in-browser compiler needs two guarantees: the main page must never freeze, and the code it runs must be contained. Both come from the same primitive — the Web Worker. A worker is a separate thread with its own heap and no access to the page's DOM, which makes it a natural sandbox: expensive or hostile code runs out-of-sight, and the main thread can kill it.",
    },
    {
      type: "h2",
      text: "One worker per run",
    },
    {
      type: "p",
      text: "The compiler creates a dedicated worker for every execution. Code runs only inside that worker, so it cannot touch the page's state, and because workers are process-isolated at the browser level, a runaway loop cannot block scrolling or typing. This is why a browser playground should never eval on the main thread — the single biggest architectural choice, and the boring one that prevents all the horror stories.",
    },
    {
      type: "h2",
      text: "The async wrapper and top-level await",
    },
    {
      type: "p",
      text: "User snippets often want top-level await: fetch something, then log the result. The runner takes your source and wraps it in an async function built with new Function at the worker side, giving the snippet a real event loop to work with. Snippets then complete on their own schedule, and their console output is pushed back to the main page as the run progresses.",
    },
    {
      type: "h2",
      text: "The 10-second kill switch",
    },
    {
      type: "p",
      text: "Every run is bound to a hard timeout. If the snippet has not finished in ten seconds — an infinite loop, a hung await, or plain slow work — the worker is terminated. Because the worker is a thread the browser can destroy, the page keeps responding even while the snippet is being killed, and a status message explains that the run timed out rather than leaving a mystery.",
    },
    {
      type: "code",
      label: "The lifecycle for a single run",
      code: `worker = new Worker(runnerUrl)
worker.postMessage({ code })
output = []
worker.onmessage = ({ data }) => output.push(data)
setTimeout(() => worker.terminate(), 10_000)`,
    },
    {
      type: "h2",
      text: "Capturing console output truthfully",
    },
    {
      type: "p",
      text: "The worker's console is patched so console.log and friends are forwarded as structured messages. The formatter handles the cases that JSON.stringify mangles: circular references are printed as Circular, BigInt values are printed with their n, and Error objects are rendered with their message and stack. What you see is what a careful console does — including the difference between a thrown Error and a logged value.",
    },
    {
      type: "h2",
      text: "TypeScript: transpile fast, don't type-check",
    },
    {
      type: "p",
      text: "TypeScript in a browser runner cannot run a full type-check cheaply, so the compiler uses the TypeScript compiler API merely to transpile: transpileModule strips the types and emits ES2020 JavaScript. It reports no diagnostics, meaning type errors are not treated as run failures — exactly the behavior of ts-node's transpile-only mode or esbuild. Imports surface as syntax errors rather than being resolved, because a browser worker has no module graph nor server to fetch from.",
    },
    {
      type: "h2",
      text: "Dart: a real sandbox via DartPad",
    },
    {
      type: "p",
      text: "Dart takes a bigger machine. The runner loads Google's DartPad SDK, which ships its own worker bootstrap, a lazy DDC incremental compiler that hot-reloads like an IDE, and a second sandboxed iframe where the compiled Dart (which runs as JavaScript) executes. The iframe is created with restricted sandbox flags, keeping Dart code away from the page. Two checks gate the whole pipeline: Web Workers and WebAssembly must be available, or the runner fails with a clear explanation instead of silently misbehaving.",
    },
    {
      type: "h2",
      text: "Why this stays client-side",
    },
    {
      type: "note",
      title: "Your code never leaves the browser",
      text: "Runs are compiled and executed locally; worker bundles and the DartPad SDK come from the same origin, and nothing round-trips through a server. That makes an in-browser compiler genuinely useful for private snippets containing real data.",
    },
    {
      type: "h2",
      text: "Try it",
    },
    {
      type: "p",
      text: "Open the Compiler and run a JavaScript, TypeScript or Dart snippet. Type top-level await, an infinite loop, or a circular object, and watch the sandbox, the 10-second kill switch and the circular-aware console work in one place.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Can user code freeze my browser tab?",
          a: "No. Code executes in a worker thread; an infinite loop consumes only that thread, and the 10-second timeout terminates it before the page is affected.",
        },
        {
          q: "Why aren't TypeScript imports resolved?",
          a: "A browser worker has no module graph or server to resolve bare imports from, so import statements surface as syntax errors. The TypeScript compiler here is used for transpile-only — type stripping — not type-checking.",
        },
        {
          q: "How is that different from eval on the main thread?",
          a: "Every difference matters: eval shares your page's origin and DOM and runs on the UI thread, so it freezes the page and touches your app. A worker run is isolated, observable and terminable.",
        },
      ],
    },
  ],
};

export default article;