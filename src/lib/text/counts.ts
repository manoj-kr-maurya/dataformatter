export interface TextCounts {
  characters: number;
  lines: number;
}

export function countChars(value: string): number {
  return Array.from(value).length;
}

export function countLines(value: string): number {
  if (!value) {
    return 0;
  }
  return value.split("\n").length;
}

export function getTextCounts(value: string): TextCounts {
  return {
    characters: countChars(value),
    lines: countLines(value),
  };
}