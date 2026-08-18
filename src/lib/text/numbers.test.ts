import { expect, it, describe } from "vitest";
import { numberToWords, wordsToNumber } from "@/lib/text/numbers";

describe("numberToWords", () => {
  it("converts small numbers", () => {
    expect(numberToWords(0)).toBe("zero");
    expect(numberToWords(13)).toBe("thirteen");
    expect(numberToWords(42)).toBe("forty-two");
    expect(numberToWords(100)).toBe("one hundred");
    expect(numberToWords(123)).toBe("one hundred twenty-three");
  });
  it("converts big numbers with scales", () => {
    expect(numberToWords(1000)).toBe("one thousand");
    expect(numberToWords(1000000)).toBe("one million");
    expect(numberToWords(123456789)).toBe(
      "one hundred twenty-three million four hundred fifty-six thousand seven hundred eighty-nine",
    );
  });
  it("rejects non-safe or negative", () => {
    expect(() => numberToWords(-5)).toThrow();
    expect(() => numberToWords(Number.MAX_SAFE_INTEGER + 2)).toThrow();
  });
});

describe("wordsToNumber", () => {
  it("parses small numbers", () => {
    expect(wordsToNumber("forty-two")).toBe(42);
    expect(wordsToNumber("one hundred twenty three")).toBe(123);
  });
  it("parses scales", () => {
    expect(wordsToNumber("one million two hundred thirty four thousand five hundred sixty seven")).toBe(
      1234567,
    );
    expect(wordsToNumber("zero")).toBe(0);
  });
  it("rejects garbage", () => {
    expect(() => wordsToNumber("foobar baz")).toThrow();
    expect(() => wordsToNumber("")).toThrow();
  });
  it("round-trips", () => {
    for (const n of [0, 7, 42, 100, 999, 123456, 1000000, 999999999]) {
      expect(wordsToNumber(numberToWords(n))).toBe(n);
    }
  });
});
