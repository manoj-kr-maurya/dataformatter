/**
 * Fake data generator — deterministic (seeded) fake rows generated locally.
 * Field lists stay small but realistic; the seed makes output reproducible.
 */

export const FIELD_TYPES = [
  "fullName",
  "firstName",
  "lastName",
  "email",
  "username",
  "phone",
  "street",
  "city",
  "country",
  "company",
  "jobTitle",
  "uuid",
  "ipv4",
  "ipv6",
  "mac",
  "words",
  "sentence",
  "paragraph",
  "dateIso",
  "timeIso",
  "number",
  "boolean",
  "hexColor",
  "url",
  "alphanumUpper",
  "alphanumLower",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** One step in a nested path. `array: true` marks a named array whose
 *  element objects carry the following child segments. */
export interface PathSegment {
  key: string;
  array?: boolean;
}

export interface FieldSpec {
  name: string;
  type: FieldType;
  /** Structured path for rebuilding nested JSON output; absent = flat top-level field. */
  path?: PathSegment[];
  /** Reuse `sampleValue` verbatim for every row instead of generating a new one. */
  keepSample?: boolean;
  /** The original value seen in the pasted sample (used when `keepSample` is set). */
  sampleValue?: string | number | boolean;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function intBetween(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

const FIRST = ["Avery","Chloe","Daniel","Ethan","Fatima","Grace","Hannah","Ivan","Jasmine","Khai","Liam","Mia","Noah","Olivia","Priya","Quinn","Ravi","Sofia","Theo","Uma","Victor","Wren","Xavier","Yara","Zane"];
const LAST = ["Adams","Baker","Chen","Diaz","Evans","Fernandez","Gray","Hassan","Ito","Jones","Khan","Lopez","Meyer","Nguyen","Ortega","Patel","Quinn","Reyes","Silva","Tanaka","Umar","Vega","Walker","Xu","Young","Zhao"];
const CITIES = ["Austin","Bangalore","Berlin","London","Melbourne","Montreal","Nairobi","Oslo","Paris","Porto","Seattle","Singapore","Tel Aviv","Tokyo","Toronto","Vancouver","Warsaw","Zurich"];
const COUNTRIES = ["Australia","Brazil","Canada","Egypt","France","Germany","India","Japan","Kenya","Mexico","Netherlands","New Zealand","Nigeria","Portugal","Singapore","Spain","United Kingdom","United States"];
const COMPANIES = ["Atlas Labs","Bluewave","Cloudnine","Dataloft","Everloop","Fieldnote","Graviton","Helio","Ironpine","Kelvin","Lumenary","Nimbus","Orbitworks","Pinecroft","Quantix","Redshift","Solarveil","Terraform Labs","Vertex","Zephyr Systems"];
const JOBS = ["Backend Engineer","Data Engineer","DevOps Engineer","Frontend Engineer","ML Engineer","Platform Engineer","Security Engineer","Staff Engineer","SRE","Technical Lead"];
const STREETS = ["Apple St","Birch Ave","Cedar Rd","Elm St","Grove Rd","Hill St","Juniper Ave","Lake Rd","Main St","Maple Ave","Oak St","Pine Rd","River Ave","Spruce St","Valley Rd","Willow Ave"];
const IDENTIFIERS = ["delta","foxtrot","kilo","mango","nova","pixel","quasar","raven","sierra","tango","ultra","vortex","whiskey","yankee","zephyr"];
const HEX = "0123456789abcdef";

function email(first: string, last: string, rng: () => number): string {
  const host = pick(rng, ["gmail.com", "outlook.com", "proton.me", "mail.com", "yahoo.com"]);
  return `${first.toLowerCase()}.${last.toLowerCase()}${intBetween(rng, 1, 99)}@${host}`;
}

function words(rng: () => number, count: number): string {
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pick(rng, IDENTIFIERS));
  return out.join(" ");
}

function sentence(rng: () => number): string {
  const count = intBetween(rng, 6, 12);
  const body = words(rng, count);
  return body.charAt(0).toUpperCase() + body.slice(1) + ".";
}

function paragraph(rng: () => number): string {
  const sentences = [];
  const total = intBetween(rng, 3, 6);
  for (let i = 0; i < total; i++) sentences.push(sentence(rng));
  return sentences.join(" ");
}

function dateIso(rng: () => number): string {
  const year = intBetween(rng, 2018, 2026);
  const month = String(intBetween(rng, 1, 12)).padStart(2, "0");
  const day = String(intBetween(rng, 1, 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeIso(rng: () => number): string {
  const h = String(intBetween(rng, 0, 23)).padStart(2, "0");
  const m = String(intBetween(rng, 0, 59)).padStart(2, "0");
  const s = String(intBetween(rng, 0, 59)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function ipv4(rng: () => number): string {
  return `${intBetween(rng, 1, 254)}.${intBetween(rng, 0, 255)}.${intBetween(rng, 0, 255)}.${intBetween(rng, 1, 254)}`;
}

function ipv6(rng: () => number): string {
  const groups: string[] = [];
  for (let i = 0; i < 8; i++) {
    let g = "";
    const len = intBetween(rng, 1, 4);
    for (let j = 0; j < len; j++) g += pick(rng, HEX.split(""));
    groups.push(g);
  }
  return groups.join(":");
}

function mac(rng: () => number): string {
  const bytes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const b = intBetween(rng, 0, 255).toString(16).padStart(2, "0");
    bytes.push(b);
  }
  return bytes.join(":");
}

function uuid(rng: () => number): string {
  const hex = () => intBetween(rng, 0, 255).toString(16).padStart(2, "0");
  const parts = [8, 4, 4, 4, 12].map((n) => {
    let out = "";
    for (let i = 0; i < n; i++) out += hex();
    return out;
  });
  return `${parts[0]}-${parts[1]}-4${parts[2].slice(1)}-${PickVariant(rng)}${parts[3].slice(1)}-${parts[4]}`;
}

function PickVariant(rng: () => number): string {
  return pick(rng, ["8", "9", "a", "b"]);
}

function phone(rng: () => number): string {
  const cc = pick(rng, ["+1", "+44", "+91", "+49", "+61", "+81"]);
  const group = (n: number) => {
    let d = "";
    for (let j = 0; j < n; j++) d += String(intBetween(rng, 0, 9));
    return d;
  };
  return `${cc} ${group(3)} ${group(3)} ${group(4)}`;
}

function numberValue(rng: () => number): number {
  return Math.round((rng() * 100_000) * 100) / 100;
}

export function generateValue(type: FieldType, rng: () => number): string | number | boolean {
  switch (type) {
    case "fullName": {
      const f = pick(rng, FIRST);
      return `${f} ${pick(rng, LAST)}`;
    }
    case "firstName": return pick(rng, FIRST);
    case "lastName": return pick(rng, LAST);
    case "email": {
      return email(pick(rng, FIRST), pick(rng, LAST), rng);
    }
    case "username": {
      return `${pick(rng, IDENTIFIERS)}${intBetween(rng, 1, 999)}`;
    }
    case "phone": return phone(rng);
    case "street": return `${intBetween(rng, 1, 999)} ${pick(rng, STREETS)}`;
    case "city": return pick(rng, CITIES);
    case "country": return pick(rng, COUNTRIES);
    case "company": return pick(rng, COMPANIES);
    case "jobTitle": return pick(rng, JOBS);
    case "uuid": return uuid(rng);
    case "ipv4": return ipv4(rng);
    case "ipv6": return ipv6(rng);
    case "mac": return mac(rng);
    case "words": return words(rng, intBetween(rng, 3, 8));
    case "sentence": return sentence(rng);
    case "paragraph": return paragraph(rng);
    case "dateIso": return dateIso(rng);
    case "timeIso": return timeIso(rng);
    case "number": return numberValue(rng);
    case "boolean": return rng() > 0.5;
    case "hexColor": {
      let color = "#";
      for (let i = 0; i < 6; i++) color += pick(rng, HEX.split(""));
      return color;
    }
    case "url": {
      const tld = pick(rng, ["com", "org", "net", "io", "dev"]);
      return `https://${pick(rng, IDENTIFIERS)}.${tld}/${pick(rng, IDENTIFIERS)}`;
    }
    case "alphanumUpper": {
      return alphanumeric(rng, intBetween(rng, 8, 12), "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
    }
    case "alphanumLower": {
      return alphanumeric(rng, intBetween(rng, 8, 12), "abcdefghijklmnopqrstuvwxyz0123456789");
    }
  }
}

/** Random alphanumeric string of the given length drawn from `alphabet`. */
function alphanumeric(rng: () => number, length: number, alphabet: string): string {
  const chars = alphabet.split("");
  let out = "";
  for (let i = 0; i < length; i++) out += pick(rng, chars);
  return out;
}

export function generateRows(fields: FieldSpec[], count: number, seed: string): Record<string, string | number | boolean>[] {
  const rng = mulberry32(hashString(seed || "default"));
  const rows: Record<string, string | number | boolean>[] = [];
  for (let i = 0; i < count; i++) {
    const row: Record<string, string | number | boolean> = {};
    for (const field of fields) {
      if (!field.name.trim()) continue;
      row[field.name] = field.keepSample && field.sampleValue !== undefined
        ? field.sampleValue
        : generateValue(field.type, rng);
    }
    rows.push(row);
  }
  return rows;
}

/** Rebuild nested objects / arrays of objects from flat rows using each
 *  field's structured `path`. Values whose path carries no segments stay flat. */
export function nestRows(
  fields: FieldSpec[],
  flatRows: Record<string, string | number | boolean>[],
): Record<string, unknown>[] {
  return flatRows.map((row) => {
    const root: Record<string, unknown> = {};
    for (const field of fields) {
      if (!field.path || field.path.length === 0) {
        root[field.name] = row[field.name];
        continue;
      }
      setPath(root, field.path, row[field.name]);
    }
    return root;
  });
}

/** Walk the structured path, creating nested objects and array-of-object
 *  containers on demand, and store the leaf value at the final key. */
function setPath(root: Record<string, unknown>, segments: PathSegment[], value: unknown): void {
  let obj: Record<string, unknown> = root;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.array) {
      const current = obj[seg.key];
      let arr: Record<string, unknown>[];
      if (Array.isArray(current) && current.length > 0 && typeof current[0] === "object") {
        arr = current as Record<string, unknown>[];
      } else {
        arr = [{}];
      }
      obj[seg.key] = arr;
      obj = arr[0];
      continue;
    }
    if (i === segments.length - 1) {
      obj[seg.key] = value;
      return;
    }
    let child = obj[seg.key];
    if (typeof child !== "object" || child === null || Array.isArray(child)) {
      child = {};
    }
    obj[seg.key] = child;
    obj = child as Record<string, unknown>;
  }
}

export function defaultFields(): FieldSpec[] {
  return [
    { name: "id", type: "uuid" },
    { name: "name", type: "fullName" },
    { name: "email", type: "email" },
    { name: "city", type: "city" },
    { name: "company", type: "company" },
    { name: "jobTitle", type: "jobTitle" },
  ];
}