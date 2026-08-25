import type { Metadata } from "next";
import { Suspense } from "react";
import { CompilerWorkbench } from "@/components/compiler/compiler-workbench";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/compiler");

export default function CompilerPage() {
  return (
    <>
      <h1 className="sr-only">Online Dart, JavaScript &amp; TypeScript Compiler</h1>
      {/* Suspense boundary required because the workbench reads ?lang= via
          useSearchParams while this page prerenders statically. */}
      <Suspense fallback={null}>
        <CompilerWorkbench />
      </Suspense>
    </>
  );
}
