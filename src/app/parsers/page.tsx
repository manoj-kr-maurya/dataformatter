import type { Metadata } from "next";
import Link from "next/link";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { HubContent } from "@/components/seo/hub-content";
import { PARSER_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/parsers");

const faqs = [
  {
    q: "What does parsing mean here?",
    a: "Parsing turns raw text into structured parts: a URL becomes scheme, host, path and individual query parameters; JSON becomes a typed tree; XML becomes an element hierarchy.",
  },
  {
    q: "How is the URL parser different from decodeURIComponent?",
    a: "Decoding only un-escapes characters. The URL parser splits the string structurally — protocol, hostname, port, path segments, and each query parameter with its own decoded value — so you can see exactly how a server will read it.",
  },
  {
    q: "What does 'typed tree' mean for JSON?",
    a: "Every value is labelled with its type (string, number, boolean, null, object, array), which makes it obvious when a number arrived as a quoted string — a classic integration bug.",
  },
  {
    q: "Can it parse YAML to JSON?",
    a: "Yes. Paste YAML and get equivalent JSON, ready for tools and pipelines that expect JSON configuration.",
  },
  {
    q: "Do parsers handle invalid input?",
    a: "They report what failed and where rather than guessing. For detailed JSON syntax errors with line numbers, use the dedicated JSON Validator.",
  },
] as const;

export default function ParsersPage() {
  return (
    <>
      <DevToolsShell tools={PARSER_TOOL_ORDER} activeHref="/parsers" heading="Parsers" />
      <HubContent
        path="/parsers"
        intro={
          <>
            <h2 className="text-xl font-semibold tracking-tight">Take messy text apart, piece by piece</h2>
            <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
              Debugging starts by understanding structure: which query parameters did that tracking
              link really contain? What type did the API return this field as? Is the YAML deploy file
              equivalent to the JSON the service expects? These parsers answer those questions
              instantly, entirely in your browser — paste logs, links and payloads freely.
            </p>
          </>
        }
        tableHeaders={["Input", "What you'll see"]}
        tableCaption="Available parsers and their output"
        tableRows={[
          ["URL", "Scheme, host, port, path segments and each query parameter separately"],
          [
            <>
              <Link key="jv" href="/json-validator" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                JSON
              </Link>
            </>,
            "Typed tree view labelling every value's data type",
          ],
          ["XML", "Element hierarchy with attributes and text nodes"],
          [
            "YAML",
            <>
              Equivalent{" "}
              <Link key="jf" href="/json-formatter" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                JSON, formatted
              </Link>{" "}
              for diffing and pipelines
            </>,
          ],
          [
            "Encoded URLs first?",
            <>
              Decode escapes with the{" "}
              <Link key="ud" href="/url-decoder" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">
                URL Decoder
              </Link>{" "}
              before parsing
            </>,
          ],
        ]}
        faqs={faqs}
      />
    </>
  );
}
