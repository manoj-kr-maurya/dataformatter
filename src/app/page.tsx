import { Logo } from "@/components/brand/logo";
import { PrivacyNotice } from "@/components/privacy/privacy-notice";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Workspace } from "@/components/workspace/workspace";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2.5">
          <Logo className="h-8 w-8 rounded-lg" />
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              DevTools
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              JSON, Base64 &amp; developer utilities
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <Workspace />

      <footer className="flex shrink-0 items-center justify-center border-t border-zinc-200 bg-zinc-50/60 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <PrivacyNotice />
      </footer>
    </div>
  );
}