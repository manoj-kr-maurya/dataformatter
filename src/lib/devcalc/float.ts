/**
 * IEEE-754 float64 / float32 bit-layout extraction. Reads the actual stored
 * bit pattern so subnormals, infinities and NaN are reported exactly as the
 * hardware stores them.
 */

export type FloatWidth = 32 | 64;

export type FloatKind = "normal" | "subnormal" | "zero" | "infinity" | "nan";

export interface FloatDetails {
  width: FloatWidth;
  sign: number;
  exponentBits: string;
  fractionBits: string;
  fullBinary: string;
  hex: string;
  bias: number;
  exponentRaw: number;
  exponentValue: number;
  kind: FloatKind;
  mantissaLabel: string;
  valueLabel: string;
}

export function floatDetails(value: number, width: FloatWidth): FloatDetails {
  let bits: bigint;
  const buffer = new ArrayBuffer(width === 32 ? 4 : 8);
  const view = new DataView(buffer);
  if (width === 32) {
    view.setFloat32(0, value);
    bits = BigInt(view.getUint32(0));
  } else {
    view.setFloat64(0, value);
    bits = BigInt(view.getBigUint64(0));
  }

  const exponentSize = width === 32 ? 8 : 11;
  const fractionSize = width === 32 ? 23 : 52;
  const bias = width === 32 ? 127 : 1023;

  const sign = Number((bits >> BigInt(width - 1)) & 1n);
  const exponentRaw = Number((bits >> BigInt(fractionSize)) & ((1n << BigInt(exponentSize)) - 1n));
  const fraction = bits & ((1n << BigInt(fractionSize)) - 1n);

  const fullBinary = bits.toString(2).padStart(width, "0");
  const exponentBits = fullBinary.slice(1, 1 + exponentSize);
  const fractionBits = fullBinary.slice(1 + exponentSize);

  const exponentAllOnes = exponentRaw === (1 << exponentSize) - 1;
  let kind: FloatKind;
  if (exponentAllOnes && fraction === 0n) kind = "infinity";
  else if (exponentAllOnes) kind = "nan";
  else if (exponentRaw === 0 && fraction === 0n) kind = "zero";
  else if (exponentRaw === 0) kind = "subnormal";
  else kind = "normal";

  const exponentValue = kind === "normal" || kind === "subnormal" ? exponentRaw - bias : 0;
  const mantissaLabel =
    kind === "normal" ? `1.${fractionBits}` : `0.${fractionBits}`;

  const valueLabel =
    kind === "nan" ? "NaN"
      : kind === "infinity" ? (sign ? "-∞" : "∞")
        : kind === "zero" ? String(value) // preserves "-0"
          : String(value);

  const hex = `0x${bits.toString(16).padStart(width / 4, "0").toUpperCase()}`;

  return {
    width,
    sign,
    exponentBits,
    fractionBits,
    fullBinary,
    hex,
    bias,
    exponentRaw,
    exponentValue,
    kind,
    mantissaLabel,
    valueLabel,
  };
}

/** Human rendering of the bit layout like "0 | 10000000 | 110…". */
export function floatLayout(value: number, width: FloatWidth): string {
  const d = floatDetails(value, width);
  return `${d.sign} | ${d.exponentBits} | ${d.fractionBits}`;
}