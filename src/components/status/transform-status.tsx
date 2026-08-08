"use client";

import { CheckIcon, LoaderIcon, AlertIcon, ShieldIcon } from "@/components/ui/icons";

export type StatusKind = "neutral" | "success" | "error" | "info";

export interface TransformStatusData {
  kind: StatusKind;
  text: string;
}

interface TransformStatusProps {
  status: TransformStatusData;
}

const styleByKind: Record<StatusKind, string> = {
  neutral: "text-zinc-400 dark:text-zinc-500",
  success: "text-emerald-600 dark:text-emerald-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-sky-600 dark:text-sky-400",
};

function StatusIcon({ kind }: { kind: StatusKind }) {
  switch (kind) {
    case "success":
      return <CheckIcon className="h-3.5 w-3.5" />;
    case "error":
      return <AlertIcon className="h-3.5 w-3.5" />;
    case "info":
      return <ShieldIcon className="h-3.5 w-3.5" />;
    default:
      return <LoaderIcon className="h-3.5 w-3.5" />;
  }
}

export function TransformStatus({ status }: TransformStatusProps) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`flex min-h-5 items-center gap-2 text-xs font-medium ${styleByKind[status.kind]}`}
    >
      <StatusIcon kind={status.kind} />
      <span className="truncate">{status.text}</span>
    </p>
  );
}