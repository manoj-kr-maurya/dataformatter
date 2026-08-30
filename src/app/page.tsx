import type { Metadata } from "next";
import { DevToolsShell } from "@/components/app/devtools-shell";
import { HomeContent } from "@/components/seo/home-content";
import { HOME_TOOL_ORDER } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/");

export default function Home() {
  return (
    <>
      <DevToolsShell tools={HOME_TOOL_ORDER} activeHref="/" heading="Privacy-First Developer Tools" />
      <HomeContent />
    </>
  );
}