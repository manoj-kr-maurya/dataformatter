export interface TextCounts {
  characters: number;
  lines: number;
  words: number;
}

export function countChars(value: string): number {
  let count = 0;
  for (let i = 0; i < value.length; ) {
    const codePoint = value.codePointAt(i) ?? 0;
    i += codePoint > 0xffff ? 2 : 1;
    count++;
  }
  return count;
}

export function countLines(value: string): number {
  if (!value) {
    return 0;
  }
  let lines = 1;
  for (const char of value) {
    if (char === "\n") {
      lines++;
    }
  }
  return lines;
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