import type { Metadata } from "next";
import { CompilerWorkbench } from "@/components/compiler/compiler-workbench";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/compiler");

export default function CompilerPage() {
  return (
    <>
      <h1 className="sr-only">Online Dart Compiler</h1>
      <CompilerWorkbench />
    </>
  );
}
