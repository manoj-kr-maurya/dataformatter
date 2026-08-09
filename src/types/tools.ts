export type Language = "text" | "json";

export type ToolType =
  | "JSON_FORMAT"
  | "JSON_MINIFY"
  | "BASE64_ENCODE"
  | "BASE64_DECODE"
  | "BASE64_TO_JSON"
  | "JSON_TO_BASE64"
  | "JWT_DECODE";

export type ToolMode = "AUTO_DETECT" | ToolType;

export type ViewMode = "single" | "split";

export interface ToolMeta {
  id: ToolType;
  label: string;
  description: string;
}

export type { DetectedType, TransformationKind, TransformationResult } from "@/types/transformation";