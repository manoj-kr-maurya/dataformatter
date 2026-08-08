import { ShieldIcon } from "@/components/ui/icons";

export function PrivacyNotice() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
      <ShieldIcon className="h-3.5 w-3.5" />
      Your data stays in your browser. Nothing is uploaded to our servers.
    </p>
  );
}