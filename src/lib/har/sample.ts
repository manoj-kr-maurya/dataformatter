/**
 * Sample HAR generator — small, deterministic, exercises failures, slow
 * requests, duplicates, redirects, auth, a large response and JSON bodies.
 * Used by the "Example HAR" button; the values are fabricated sample data.
 */

function entry(input: Record<string, unknown>): Record<string, unknown> {
  return {
    startedDateTime: input.startedDateTime,
    time: input.time ?? -1,
    request: {
      method: input.method,
      url: input.url,
      httpVersion: "HTTP/2",
      headers: [
        ...(input.auth ? [{ name: "Authorization", value: input.auth }] : []),
        { name: "Accept", value: "application/json" },
        { name: "Host", value: "example.com" },
        { name: "User-Agent", value: "Mozilla/5.0 sample-har" },
      ],
      queryString: input.query ?? [],
      cookies: input.cookies ?? [],
      headersSize: 200,
      bodySize: input.bodyText ? (input.bodyText as string).length : 0,
      ...(input.bodyText
        ? { postData: { mimeType: "application/json", text: input.bodyText } }
        : {}),
    },
    response: {
      status: input.status ?? 200,
      statusText: input.statusText ?? "OK",
      httpVersion: "HTTP/2",
      headers: input.responseHeaders ?? [
        { name: "content-type", value: "application/json; charset=utf-8" },
        { name: "cache-control", value: input.cacheControl ?? "no-store" },
        { name: "date", value: "Sat, 01 Jan 2026 10:00:00 GMT" },
      ],
      content: input.responseText
        ? {
            size: (input.responseText as string).length,
            mimeType: input.mimeType ?? "application/json",
            text: input.responseText,
          }
        : { size: input.contentSize ?? 0, mimeType: input.mimeType ?? "" },
      headersSize: 300,
      bodySize: input.responseText ? (input.responseText as string).length : 0,
      redirectURL: input.redirectUrl ?? "",
    },
    cache: {},
    timings: input.timings ?? { blocked: 0, dns: 2, connect: 12, ssl: 8, send: 1, wait: 30, receive: 4 },
    comment: input.comment,
  };
}

function largeJson(sizeKb: number): string {
  const rows: string[] = [];
  for (let i = 0; i < sizeKb; i++) {
    rows.push(`{"id":${i},"name":"item-${i}","tags":["a","b","c"],"active":${i % 2 === 0}}`);
  }
  return `[${rows.join(",")}]`;
}

export function buildSampleHar(): string {
  const base = "2026-01-01T10:00:00.000Z";
  const plus = (ms: number) => new Date(Date.parse(base) + ms).toISOString();
  const at = (ms: number) => ({ startedDateTime: plus(ms) });

  const entries = [
    entry({
      ...at(0),
      method: "GET",
      url: "https://example.com/config.json",
      time: 55,
      cacheControl: "public, max-age=3600",
      responseText: JSON.stringify({ version: "2.4.1", flags: { beta: false } }),
      timings: { blocked: 3, dns: 4, connect: 24, ssl: 9, send: 1, wait: 12, receive: 2 },
    }),
    entry({
      ...at(60),
      method: "GET",
      url: "https://example.com/api/user",
      time: 130,
      auth: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1hbm9qIFNpbmdoIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4RwMeSfJPf",
      responseText: JSON.stringify({ id: 42, name: "Manoj Singh", role: "developer" }),
      timings: { blocked: 2, dns: 1, connect: 9, ssl: 5, send: 1, wait: 108, receive: 4 },
    }),
    entry({
      ...at(200),
      method: "GET",
      url: "https://example.com/api/user",
      time: 95,
      auth: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1hbm9qIFNpbmdoIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4RwMeSfJPf",
      responseText: JSON.stringify({ id: 42, name: "Manoj Singh", role: "developer" }),
      timings: { wait: 85, send: 1, receive: 9 },
    }),
    entry({
      ...at(320),
      method: "GET",
      url: "https://example.com/old-link",
      status: 302,
      statusText: "Found",
      redirectUrl: "https://example.com/new-link",
      responseText: "",
      timings: { dns: 2, connect: 10, ssl: 6, wait: 25, receive: 1 },
    }),
    entry({
      ...at(400),
      method: "POST",
      url: "https://example.com/api/orders",
      time: 4860,
      bodyText: JSON.stringify({ itemId: "sku-99", qty: 2 }),
      responseText: JSON.stringify({ orderId: "ord_1" }),
      timings: { blocked: 5, dns: 3, connect: 18, ssl: 9, send: 4, wait: 4780, receive: 41 },
    }),
    entry({
      ...at(700),
      method: "GET",
      url: "https://example.com/api/profile",
      status: 401,
      statusText: "Unauthorized",
      time: 60,
      auth: "Bearer ", // token not actually valid
      responseText: JSON.stringify({ error: "invalid_token" }),
      timings: { dns: 1, connect: 8, ssl: 4, send: 1, wait: 42, receive: 4 },
    }),
    entry({
      ...at(800),
      method: "GET",
      url: "https://example.com/api/config",
      status: 404,
      statusText: "Not Found",
      time: 40,
      responseText: JSON.stringify({ error: "not_found" }),
      timings: { dns: 1, connect: 6, ssl: 3, wait: 28, receive: 2 },
    }),
    entry({
      ...at(900),
      method: "POST",
      url: "https://example.com/api/payment",
      status: 503,
      statusText: "Service Unavailable",
      time: 340,
      bodyText: JSON.stringify({ amount: 1999, currency: "USD" }),
      responseText: JSON.stringify({ error: "upstream_timeout" }),
      timings: { blocked: 2, dns: 4, connect: 22, ssl: 10, send: 2, wait: 290, receive: 10 },
    }),
    entry({
      ...at(950),
      method: "POST",
      url: "https://example.com/api/payment",
      status: 503,
      statusText: "Service Unavailable",
      time: 320,
      bodyText: JSON.stringify({ amount: 1999, currency: "USD" }),
      responseText: JSON.stringify({ error: "upstream_timeout" }),
    }),
    entry({
      ...at(1000),
      method: "POST",
      url: "https://example.com/api/payment",
      status: 500,
      statusText: "Internal Server Error",
      time: 310,
      bodyText: JSON.stringify({ amount: 1999, currency: "USD" }),
      responseText: JSON.stringify({ error: "payment_provider_down" }),
    }),
    entry({
      ...at(1100),
      method: "GET",
      url: "https://example.com/api/products?page=1",
      time: 480,
      responseText: largeJson(120),
      mimeType: "application/json",
      timings: { dns: 2, connect: 11, ssl: 6, send: 2, wait: 420, receive: 39 },
    }),
  ];

  return JSON.stringify({ log: { version: "1.2", creator: { name: "DataFormatter sample", version: "1.0" }, entries } }, null, 2);
}