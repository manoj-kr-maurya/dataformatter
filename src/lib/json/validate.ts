export interface JsonError {
  title: string;
  message: string;
  position?: number;
  line?: number;
  column?: number;
}

export interface JsonParsed {
  value: unknown;
}

export type JsonParseResult =
  | ({ ok: true } & JsonParsed)
  | { ok: false; error: JsonError };

function getMessagePosition(message: string): number | undefined {
  const positionMatch = /position\s+(\d+)/.exec(message);
  if (positionMatch) {
    return Number(positionMatch[1]);
  }

  const lineMatch = /line\s+(\d+)\s+column\s+(\d+)/.exec(message);
  if (lineMatch && Number(lineMatch[1]) === 1) {
    return Number(lineMatch[2]);
  }

  return undefined;
}

function locate(input: string, position: number): Pick<JsonError, "line" | "column"> {
  if (position < 0) {
    return {};
  }
  const upTo = input.slice(0, position);
  const line = upTo.split("\n").length;
  const lastLineBreak = upTo.lastIndexOf("\n");
  const column = position - lastLineBreak;
  return { line, column };
}

export function parseJson(input: string): JsonParseResult {
  try {
    const value = JSON.parse(input);
    return { ok: true, value };
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "An unknown JSON parsing error occurred.";
    const position = getMessagePosition(rawMessage);
    const location = position === undefined ? {} : locate(input, position);

    const message = rawMessage.replace(/\s+in\s+JSON(?:\sat\s+position\s+\d+)?$/, "");

    return {
      ok: false,
      error: {
        title: "Invalid JSON",
        message,
        position,
        ...location,
      },
    };
  }
}

export function isJson(input: string): boolean {
  return parseJson(input).ok;
}