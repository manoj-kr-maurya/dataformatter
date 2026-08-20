"use client";

import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export interface EditorAction {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  variant?: "primary" | "secondary" | "success";
}

interface EditorActionsProps {
  actions: EditorAction[];
}

export function EditorActions({ actions }: EditorActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {actions.map((action) => (
        <Button
          key={action.key}
          variant={action.variant ?? "secondary"}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled}
          aria-label={action.label}
          title={action.title}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}