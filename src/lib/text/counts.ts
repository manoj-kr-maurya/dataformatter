export interface TextCounts {
  characters: number;
  lines: number;
  words: number;
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

export function countWords(value: string): number {
  const match = value.match(/[\p{L}\p{N}_]+(?:['’-][\p{L}\p{N}_]+)*/gu);
  return match ? match.length : 0;
}

export function getTextCounts(value: string): TextCounts {
  return {
    characters: countChars(value),
    lines: countLines(value),
    words: countWords(value),
  };
}