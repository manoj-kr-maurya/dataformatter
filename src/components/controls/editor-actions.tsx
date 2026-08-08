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
}

interface EditorActionsProps {
  actions: EditorAction[];
}

export function EditorActions({ actions }: EditorActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.key}
          variant="secondary"
          size="md"
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