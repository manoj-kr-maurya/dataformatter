import Link from "next/link";
import { ShieldIcon } from "@/components/ui/icons";

export function PrivacyNotice() {
  return (
    <Link
      href="/privacy"
      className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
    >
      <ShieldIcon className="h-3.5 w-3.5" />
      Your data stays in your browser. Nothing is uploaded to our servers.
    </Link>
  );
}