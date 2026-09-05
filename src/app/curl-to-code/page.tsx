import type { Metadata } from "next";
import Link from "next/link";
import { CurlToCodeWorkbench } from "@/components/devtools/curl-to-code-workbench";
import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import {
  Section,
  Bullets,
  Example,
  QuickStart,
  UseCases,
  Troubleshooting,
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata, FOOTER_LINKS, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/curl-to-code");

const faqs = [
  {
    q: "How does a cURL command become code?",
    a: "The command is parsed by the same tokenizer the API tester uses, so the method, URL, query, headers, auth and body are all recovered faithfully. That structured request is then rendered by a per-language generator.",
  },
  {
    q: "Which languages are supported?",
    a: "JavaScript fetch, Axios, Python requests, Java (java.net.http.HttpClient), Go, C# (System.Net.Http) and PHP (cURL). One paste, seven dialects.",
  },
  {
    q: "My curl uses --compressed or -v. Will import break?",
    a: "No. Flags this tool doesn't model (like --compressed, -v, --max-time) are ignored gracefully, and the URL, method, headers, data, -u basic auth and -F multipart fields it does understand are preserved.",
  },
  {
    q: "Does it handle single and double quotes in my shell command?",
    a: "Yes. The tokenizer handles single-quoted literals (including the '\\'' join trick), double quotes, backslash-line continuations, and $'…' ANSI-C escapes like \\n — so multi-line curl you copied from a terminal works as-is.",
  },
  {
    q: "Why is there a Normalized cURL output?",
    a: "After parsing, the same structured request is rendered back as a canonical curl command. It's useful for sharing a reproducible version of a request you originally pasted with odd quoting.",
  },
  {
    q: "Is my command uploaded?",
    a: "No. Parsing and code generation happen entirely in the browser, so API keys and Authorization headers in your paste never leave your machine.",
  },
] as const;

export default function CurlToCodePage() {
  return (
    <>
      <CurlToCodeWorkbench activeHref="/curl-to-code" />
      <ToolSeoContent
        path="/curl-to-code"
        summary="Turn any cURL command into JavaScript fetch, Axios, Python requests, Java, Go, C# or PHP in one click. Paste a command from your terminal or an API doc and get a faithful, copy-paste-ready request."
        faqs={faqs}
      >
        <QuickStart
          steps={[
            "Copy a cURL command from your terminal, an API doc, or DevTools.",
            "Paste it into the box — the method, URL, headers, auth and body are parsed instantly.",
            "Pick the language you want from the segmented control.",
            "Copy the generated snippet, or grab the Normalized cURL for a reusable canonical version.",
          ]}
        />

        <Section title="What cURL to code generates">
          <Bullets
            items={[
              "fetch with explicit method, headers.json, string body and resolved URL.",
              "Axios config with method, url, params, headers and data.",
              "Python requests.session() style code with headers and json/data kwargs.",
              "Java HttpClient with HttpRequest.Builder and a URI built from parts.",
              "Go http.NewRequest with headers set and the body wrapped in a reader.",
              "C# HttpClient with HttpClientRequestMessage and a StringContent body.",
              "PHP using curl_setopt for the URL, method, headers and postfields.",
            ]}
          />
        </Section>

        <Section title="How to convert cURL to code online">
          <Bullets
            items={[
              "Export a request as cURL from Chrome DevTools (Network tab → Copy as cURL).",
              "Paste it here; the summary chips show what was understood (method, headers, query, body).",
              "Choose a dialect that matches your stack and copy the result.",
              "Smoke-test the result with the API Tester if you want to see the live response.",
            ]}
          />
          <Example
            input={`curl 'https://api.example.com/orders?dryRun=true' \\\n  -H 'Authorization: Bearer abc123' \\\n  -d '{"qty": 2}'`}
            output={`fetch("https://api.example.com/orders?dryRun=true", {\n  method: "POST",\n  headers: { \"Authorization\": "Bearer abc123" },\n  body: '{"qty": 2}'\n});`}
            inputLabel="cURL command"
            outputLabel="JavaScript fetch"
          />
        </Section>

        <Section title="Who converts cURL to code — and when">
          <UseCases
            cases={[
              {
                title: "Reproducing an API call from docs",
                body: "Docs ship curl samples, your app needs code. Paste once and get a snippet in the language your team actually writes.",
              },
              {
                title: "Moving from Postman/DevTools to scripted tests",
                body: "Turn a hand-tested request into a Python or Go snippet for your test suite in seconds.",
              },
              {
                title: "Onboarding without auth drama",
                body: "Convert and run against a sandbox — the parsed Authorization header survives, so the snippet works the first time.",
              },
            ]}
          />
        </Section>

        <Section title="Common issues">
          <Troubleshooting
            items={[
              {
                error: "\"That doesn't look like a cURL command\"",
                cause: "The paste doesn't start with curl (e.g. it began with 'curl.exe' on Windows, or an env-var prefix).",
                fix: "Paste the raw command starting at curl. Windows curl.exe is accepted, but drop prefixes like 'Invoke-WebRequest' that use a different syntax.",
              },
              {
                error: "Missing URL",
                cause: "The command contains no URL token, so nothing can be generated.",
                fix: "Re-export the request — DevTools always includes the URL.",
              },
              {
                error: "Body came out as raw text",
                cause: "A payload that isn't valid JSON or k=v pairs is treated as text — correct a lot of the time, surprising for malformed JSON.",
                fix: "Validate the body with JSON Diff or the validator, then re-paste.",
              },
            ]}
          />
        </Section>

        <Section title="Pro tips">
          <ProTips
            tips={[
              "Exports from DevTools carry Referer/Cookie/User-Agent headers — those are modeled, so expect them in the output.",
              "Basic auth via -u becomes a dedicated auth header rather than a header row.",
              "-G turns your --data into query parameters automatically (curl's documented behavior).",
              "Keep secrets local: generation never sends your tokens anywhere.",
            ]}
          />
        </Section>
      </ToolSeoContent>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {SITE_NAME} — free online developer data tools that run entirely in your browser. Your
            data stays private: nothing you paste is ever uploaded to a server.
          </p>
          <nav
            aria-label="All tools"
            className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}