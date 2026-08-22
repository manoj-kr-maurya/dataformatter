import type { Metadata } from "next";
import { CompilerWorkbench } from "@/components/compiler/compiler-workbench";

export const metadata: Metadata = {
  title: "Online Dart Compiler — Run Dart in Your Browser",
  description:
    "Free online Dart compiler and playground. Write, compile and run Dart code instantly — entirely in your browser via WebAssembly. No server, no sign-up, nothing uploaded. Includes stdin input and shareable links.",
  keywords: [
    "online dart compiler",
    "dart playground",
    "run dart online",
    "dart editor",
    "browser dart",
    "dart wasm",
    "dartpad alternative",
  ],
  alternates: { canonical: "/compiler" },
  openGraph: {
    title: "Online Dart Compiler — Run Dart in Your Browser",
    description:
      "Write, compile and run Dart instantly in your browser. Private by design: the Dart toolchain runs locally via WebAssembly.",
  },
};

export default function CompilerPage() {
  return <CompilerWorkbench />;
}
