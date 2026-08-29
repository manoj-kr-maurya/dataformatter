import type { Metadata } from "next";
import { ApiClientWorkbench } from "@/components/api-client/api-client-workbench";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/api-tester");

export default function ApiTesterPage() {
  return (
    <>
      <h1 className="sr-only">Online API Tester</h1>
      <ApiClientWorkbench activeHref="/api-tester" />
      <p className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-center text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        Requests are sent straight from your browser. Cross-origin endpoints only respond when they
        allow it via CORS — there is no server-side proxy, so nothing is ever forwarded or logged.
        Your data stays on this machine.
      </p>
    </>
  );
}