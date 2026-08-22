import { DevToolsShell } from "@/components/app/devtools-shell";
import { HOME_TOOL_ORDER } from "@/lib/tools";

export default function Home() {
  return (
    <DevToolsShell tools={HOME_TOOL_ORDER} activeHref="/" heading="DataFormatter" />
  );
}
