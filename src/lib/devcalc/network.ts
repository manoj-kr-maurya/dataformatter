/**
 * IPv4 CIDR calculator. Architecture keeps the IPv4 math isolated so IPv6 can
 * be added later as a parallel module without touching this one.
 */

export interface CidrBreakdown {
  ip: string;
  prefix: number;
  subnetMask: string;
  wildcardMask: string;
  network: string;
  broadcast: string;
  firstUsable: string;
  lastUsable: string;
  totalAddresses: number;
  usableAddresses: number;
  ipBinary: string;
  networkBinary: string;
}

export function ipv4ToNumber(ip: string): number {
  const parts = ip.trim().split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    throw new Error("Invalid IPv4 address.");
  }
  return (parts[0] * 16777216 + parts[1] * 65536 + parts[2] * 256 + parts[3]) >>> 0;
}

export function numberToIpv4(value: number): string {
  const n = value >>> 0;
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

export function ipv4Binary(ip: string): string {
  return ip
    .split(".")
    .map((octet) => Number(octet).toString(2).padStart(8, "0"))
    .join(".");
}

export function cidrBreakdown(input: string): CidrBreakdown {
  const text = input.trim();
  if (!text) throw new Error("Enter a CIDR address like 192.168.1.0/24.");
  const [ipPart, prefixPart] = text.split("/");
  const ip = ipv4ToNumber(ipPart);
  const prefix = prefixPart === undefined || prefixPart === "" ? 32 : Number(prefixPart);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error("Invalid CIDR prefix (must be 0–32).");
  }

  const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
  const network = ip & mask;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const totalAddresses = Math.pow(2, 32 - prefix);
  const pointToPoint = prefix >= 31;
  const usableAddresses = pointToPoint ? totalAddresses : totalAddresses - 2;
  const firstUsable = pointToPoint ? numberToIpv4(network) : numberToIpv4(network + 1);
  const lastUsable = pointToPoint ? numberToIpv4(broadcast) : numberToIpv4(broadcast - 1);

  return {
    ip: numberToIpv4(ip),
    prefix,
    subnetMask: numberToIpv4(mask),
    wildcardMask: numberToIpv4(~mask >>> 0),
    network: numberToIpv4(network),
    broadcast: numberToIpv4(broadcast),
    firstUsable,
    lastUsable,
    totalAddresses,
    usableAddresses,
    ipBinary: ipv4Binary(numberToIpv4(ip)),
    networkBinary: ipv4Binary(numberToIpv4(network)),
  };
}