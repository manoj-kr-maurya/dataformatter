import type { Metadata } from "next";
import { ApiClientWorkbench } from "@/components/api-client/api-client-workbench";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/api-client");

export default function ApiClientPage() {
  return (
    <>
      <h1 className="sr-only">Online API Client</h1>
      <ApiClientWorkbench />
    </>
  );
}
