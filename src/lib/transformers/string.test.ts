import { describe, expect, it } from "vitest";
import {
  caseConverter,
  delimitedTextExtractor,
  removeAccents,
  removeDuplicateLines,
  removeEmptyLines,
  removeExtraSpaces,
  removeLineBreaks,
  removeLinesContaining,
  removePunctuation,
  removeWhitespace,
  reverseString,
  sortTextLines,
  stringBuilder,
  textRepeater,
  upsideDownText,
  wordCounter,
  wordFrequencyCounter,
  wordRepeater,
  wordSorter,
} from "@/lib/transformers/stringClean";
import {
  binaryToStringConverter,
  hexToStringConverter,
  numberToWordsConverter,
  stringToBinaryConverter,
  stringToHexConverter,
  wordsToNumberConverter,
} from "@/lib/transformers/stringConvert";
import {
  ntlmHashGenerator,
  passwordGenerator,
  randomWordGenerator,
} from "@/lib/transformers/stringGenerate";

describe("upsideDownText", () => {
  it("flips and reverses text", () => {
    const result = upsideDownText("Hello world");
    expect(result.success).toBe(true);
    expect(result.output).toBe("plɹoʍ ollǝH");
    expect(result.transformation).toBe("UPSIDE_DOWN_TEXT");
  });

  it("fails on empty input", () => {
    expect(upsideDownText("  ").success).toBe(false);
  });
});

describe("reverseString", () => {
  it("reverses the characters", () => {
    const result = reverseString("abc 123");
    expect(result.success).toBe(true);
    expect(result.output).toBe("321 cba");
  });
});

describe("caseConverter", () => {
  it("converts to title case by default", () => {
    expect(caseConverter("hello world").output).toBe("Hello World");
  });

  it("supports explicit styles", () => {
    expect(caseConverter("snake hello world").output).toBe("hello_world");
    expect(caseConverter("kebab Hello World").output).toBe("hello-world");
    expect(caseConverter("camel hello world").output).toBe("helloWorld");
    expect(caseConverter("upper hello world").output).toBe("HELLO WORLD");
    expect(caseConverter("sentence hELLO wORLD").output).toBe("Hello world");
  });
});

describe("wordCounter", () => {
  it("counts words, characters and lines", () => {
    const result = wordCounter("one two\nthree");
    expect(result.success).toBe(true);
    expect(result.output).toBe("Words: 3\nCharacters: 13\nLines: 2");
  });
});

describe("wordFrequencyCounter", () => {
  it("sorts by frequency descending", () => {
    const result = wordFrequencyCounter("a b a c a b");
    expect(result.success).toBe(true);
    expect(result.output).toBe("a: 3\nb: 2\nc: 1");
  });
});

describe("wordSorter", () => {
  it("sorts words alphabetically, one per line", () => {
    expect(wordSorter("banana apple cherry").output).toBe("apple\nbanana\ncherry");
  });
});

describe("sortTextLines", () => {
  it("sorts lines with natural ordering", () => {
    expect(sortTextLines("item10\nitem2\nitem1").output).toBe("item1\nitem2\nitem10");
  });
});

describe("removeAccents", () => {
  it("strips diacritics", () => {
    expect(removeAccents("café ñoño übung").output).toBe("cafe nono ubung");
  });
});

describe("removeDuplicateLines", () => {
  it("keeps the first occurrence", () => {
    expect(removeDuplicateLines("a\nb\na\nc\nb").output).toBe("a\nb\nc");
  });
});

describe("removeEmptyLines", () => {
  it("drops blank lines", () => {
    expect(removeEmptyLines("a\n\nb\n \nc").output).toBe("a\nb\nc");
  });
});

describe("removeExtraSpaces", () => {
  it("collapses runs of spaces and trims", () => {
    expect(removeExtraSpaces("  a   b\tc  ").output).toBe("a b c");
  });
});

describe("removeWhitespace", () => {
  it("removes all whitespace", () => {
    expect(removeWhitespace("a b\tc\nd").output).toBe("abcd");
  });
});

describe("removeLineBreaks", () => {
  it("replaces newlines with a space", () => {
    expect(removeLineBreaks("a\nb\r\nc").output).toBe("a b c");
  });
});

describe("removeLinesContaining", () => {
  it("removes lines containing the word on the first line", () => {
    expect(removeLinesContaining("bad\ngood line\nthis is bad\nfine").output).toBe("good line\nfine");
  });

  it("fails when the needle is missing", () => {
    expect(removeLinesContaining("only one line").success).toBe(false);
  });
});

describe("removePunctuation", () => {
  it("strips punctuation and symbols", () => {
    expect(removePunctuation("Hello, world! How's it going?").output).toBe("Hello world Hows it going");
  });
});

describe("textRepeater", () => {
  it("repeats text a leading-number number of times", () => {
    expect(textRepeater("3 hello world").output).toBe("hello world\nhello world\nhello world");
  });

  it("defaults to 3 repeats", () => {
    expect(textRepeater("hi").output).toBe("hi\nhi\nhi");
  });
});

describe("wordRepeater", () => {
  it("repeats each word N times", () => {
    expect(wordRepeater("2 hello world").output).toBe("hello hello world world");
  });
});

describe("stringBuilder", () => {
  it("joins lines with the first-line separator", () => {
    expect(stringBuilder(",\nalpha\nbeta\ngamma").output).toBe("alpha,beta,gamma");
  });

  it("fails without a separator + items", () => {
    expect(stringBuilder("just-one-line").success).toBe(false);
  });
});

describe("delimitedTextExtractor", () => {
  it("extracts every match between delimiters", () => {
    const result = delimitedTextExtractor("[\n]\nalpha [beta] gamma [delta] omega");
    expect(result.success).toBe(true);
    expect(result.output).toBe("beta\ndelta");
  });

  it("fails when nothing matches", () => {
    expect(delimitedTextExtractor("(\n)\nno delimiters here").success).toBe(false);
  });
});

describe("string ↔ hex", () => {
  it("round-trips", () => {
    const hex = stringToHexConverter("Hello");
    expect(hex.output).toBe("48 65 6c 6c 6f");
    expect(hexToStringConverter(hex.output).output).toBe("Hello");
  });

  it("rejects bad hex", () => {
    expect(hexToStringConverter("zz").success).toBe(false);
  });
});

describe("string ↔ binary", () => {
  it("round-trips", () => {
    const binary = stringToBinaryConverter("A");
    expect(binary.output).toBe("01000001");
    expect(binaryToStringConverter(binary.output).output).toBe("A");
  });

  it("rejects non-8-bit groups", () => {
    expect(binaryToStringConverter("0101").success).toBe(false);
  });
});

describe("number ↔ words", () => {
  it("converts numbers to words", () => {
    expect(numberToWordsConverter("42").output).toBe("forty-two");
  });

  it("converts words to numbers", () => {
    expect(wordsToNumberConverter("forty-two\none hundred").output).toBe("42\n100");
  });

  it("rejects junk", () => {
    expect(numberToWordsConverter("abc").success).toBe(false);
    expect(wordsToNumberConverter("xyzzy").success).toBe(false);
  });
});

describe("randomWordGenerator", () => {
  it("generates the requested number of words", () => {
    const result = randomWordGenerator("4");
    expect(result.success).toBe(true);
    expect(result.output.split("\n")).toHaveLength(4);
    expect(result.transformation).toBe("RANDOM_WORD");
  });
});

describe("passwordGenerator", () => {
  it("generates passwords with all character classes", () => {
    const result = passwordGenerator("3 16");
    expect(result.success).toBe(true);
    const passwords = result.output.split("\n");
    expect(passwords).toHaveLength(3);
    for (const password of passwords) {
      expect(password).toHaveLength(16);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/\d/);
      expect(password).toMatch(/[^a-zA-Z0-9]/);
    }
  });
});

describe("ntlmHashGenerator", () => {
  it("matches the known NTLM hash for 123456", () => {
    const result = ntlmHashGenerator("123456");
    expect(result.success).toBe(true);
    expect(result.output).toBe("32ed87bdb5fdc5e9cba88547376818d4");
  });

  it("fails on empty input", () => {
    expect(ntlmHashGenerator("  ").success).toBe(false);
  });
});