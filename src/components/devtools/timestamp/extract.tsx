"use client";

import { useMemo, useState } from "react";
import {
  Toolbox,
  CopyButton,
  DownloadButton,
  inputClass,
  Hint,
  Stat,
} from "@/components/devtools/shared";
import { ErrBox, WarnBox, OkBox, KeyValue } from "@/components/devtools/timestamp/kit";
import { epochFromNs } from "@/lib/time/parse";
import { formatZoned } from "@/lib/time/inspect";
import {
  extractLogTimestamps,
  analyzeJwt,
  parseHttpTimestamps,
  epochUnits,
  humanizeDurationBig,
} from "@/lib/time/analyze";
import {
  developerSnippets,
  databaseSnippets,
  type SnippetGroup,
} from "@/lib/time/snippets";
import type { TimestampMode, PanelCtx } from "@/components/devtools/timestamp/kit";

const IST = "Asia/Kolkata";

function optsOf(ctx: PanelCtx) {
  return { primaryTz: ctx.primaryTz };
}

export function ExtractionPanels({
  mode,
  ctx,
  sharedMs,
  sharedIso,
}: {
  mode: TimestampMode;
  ctx: PanelCtx;
  sharedMs: number | null;
  sharedIso: string | null;
}) {
  switch (mode) {
    case "extract":
      return <LogPanel ctx={ctx} />;
    case "jwt":
      return <JwtPanel ctx={ctx} />;
    case "http":
      return <HttpPanel ctx={ctx} />;
    case "developer":
      return <DeveloperPanel ctx={ctx} sharedMs={sharedMs} sharedIso={sharedIso} />;
    default:
      return null;
  }
}

function LogPanel({ ctx }: { ctx: PanelCtx }) {
  const [text, setText] = useState(
    "2026-09-07T16:00:00Z  service booted\n[2026-09-07 16:02:10] job started\n1736956800  retry scheduled\nWed, 09 Sep 2026 20:00:00 GMT  deploy\n",
  );

  const result = useMemo(() => extractLogTimestamps(text, optsOf(ctx), ctx.primaryTz), [text, ctx]);
  const tableText = useMemo(() => {
    if (result.rows.length === 0) return "";
    const header = ["line", "format", "found", "utc", "ist"];
    const body = result.rows.map((r) => [String(r.line), r.format, `"${r.original}"`, r.utc, r.local].join(","));
    return [header.join(","), ...body].join("\n");
  }, [result]);

  return (
    <Toolbox
      title="Log extractor · detect timestamps inside text"
      actions={
        <>
          <DownloadButton filename="log-timestamps.csv" text={tableText} label=".csv" mimeType="text/csv;charset=utf-8" disabled={result.rows.length === 0} />
          <CopyButton text={tableText} label="Copy CSV" disabled={result.rows.length === 0} />
        </>
      }
    >
      <textarea
        className={`${inputClass} min-h-32 w-full font-mono text-xs`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Paste log lines. Embedded ISO-8601, RFC 1123 and Unix timestamps are detected.\nThe text itself is never altered.`}
        aria-label="Log lines"
        spellCheck={false}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Stat label="events" value={String(result.count)} />
        <Stat label="first" value={result.firstEvent} tone="default" />
        <Stat label="last" value={result.lastEvent} tone="default" />
        <Stat label="duration" value={result.totalDuration} tone="ok" />
        <Stat label="largest gap" value={result.largestGap} tone="warn" />
      </div>
      {result.rows.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                <th className="py-1 pr-2 font-medium">#</th>
                <th className="py-1 pr-2 font-medium">L</th>
                <th className="py-1 pr-2 font-medium">Format</th>
                <th className="py-1 pr-2 font-medium">Found</th>
                <th className="py-1 pr-2 font-medium">UTC</th>
                <th className="py-1 pr-2 font-medium">{ctx.primaryTz} local</th>
                <th className="py-1 pr-2 font-medium">Gap</th>
              </tr>
            </thead>
            <tbody>
              {result.chronological.map((row, index) => {
                const prev = index > 0 ? result.chronological[index - 1] : null;
                const gap = prev ? humanizeDurationBig((row.ns - prev.ns) / 1_000_000_000n) : "—";
                return (
                  <tr key={`${row.line}-${row.ns.toString()}`} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-1 pr-2 text-right">{index + 1}</td>
                    <td className="py-1 pr-2 text-right font-mono text-zinc-500">{row.line}</td>
                    <td className="py-1 pr-2 whitespace-nowrap text-zinc-500">{row.format}</td>
                    <td className="max-w-48 truncate py-1 pr-2 font-mono" title={row.original}>{row.original}</td>
                    <td className="py-1 pr-2 font-mono whitespace-nowrap">{row.utc}</td>
                    <td className="py-1 pr-2 font-mono whitespace-nowrap">{row.local}</td>
                    <td className="py-1 pr-2 whitespace-nowrap text-zinc-500">{gap}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Hint>Works fully in your browser. Your log text is never sent anywhere.</Hint>
    </Toolbox>
  );
}

function claimRow(label: string, value: { raw: string; ns: bigint; date: Date | null } | undefined, nowNs: bigint) {
  if (!value) return null;
  const cache = epochFromNs(value.ns);
  const ms = cache.msNumber;
  const relative = value.date ? relativeClaim(value.date.getTime(), nowNs) : "";
  return (
    <div key={label} className="border-b border-zinc-100 py-1 last:border-0 dark:border-zinc-800/60">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="font-mono text-xs text-zinc-700 dark:text-zinc-200">raw {value.raw}</p>
      {ms !== null && (
        <>
          <p className="font-mono text-xs text-zinc-700 dark:text-zinc-200">{formatZoned("UTC", ms)} UTC</p>
          <p className="font-mono text-xs text-zinc-700 dark:text-zinc-200">{formatZoned(IST, ms)} IST</p>
        </>
      )}
      <p className="text-[10px] text-zinc-400">{relative}</p>
    </div>
  );
}

function relativeClaim(ms: number, nowNs: bigint): string {
  const diffMs = ms - Math.round(Number(nowNs) / 1_000_000);
  const s = Math.round(diffMs / 1000);
  if (!Number.isFinite(diffMs)) return "";
  if (Math.abs(s) < 60) return s < 0 ? `${-s}s ago` : `in ${s}s`;
  const m = Math.round(s / 60);
  if (Math.abs(m) < 60) return m < 0 ? `${-m}m ago` : `in ${m}m`;
  const h = Math.round(m / 60);
  if (Math.abs(h) < 48) return h < 0 ? `${-h}h ago` : `in ${h}h`;
  const d = Math.round(h / 24);
  return d < 0 ? `${-d}d ago` : `in ${d}d`;
}

function JwtPanel({ ctx }: { ctx: PanelCtx }) {
  const [text, setText] = useState(
    '{"sub":"1234567890","iat":1736956800,"exp":1739556000,"nbf":1736956800}',
  );
  const report = useMemo(() => analyzeJwt(text, ctx.nowMs), [text, ctx.nowMs]);
  const nowNs = BigInt(ctx.nowMs) * 1_000_000n;

  return (
    <Toolbox
      title="JWT timestamp inspector · iat / exp / nbf"
      actions={<CopyButton text={text} label="Copy input" disabled={text.length === 0} />}
    >
      <textarea
        className={`${inputClass} min-h-28 w-full font-mono text-xs`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a JWT or its JSON claims payload. Parsed locally — nothing is transmitted."
        aria-label="JWT or claims JSON"
        spellCheck={false}
      />
      {report.error ? (
        <div className="mt-3"><ErrBox>{report.error}</ErrBox></div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {report.status === "valid" && <OkBox>Token is valid now.</OkBox>}
            {report.status === "expired" && <WarnBox title="Token has expired">exp is in the past.</WarnBox>}
            {report.status === "not-yet-valid" && <WarnBox title="Token is not valid yet">nbf is in the future.</WarnBox>}
            {report.status === "unknown" && <WarnBox title="No time claims found">Add iat, exp or nbf to decode timestamps.</WarnBox>}
          </div>
          <dl className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
            {report.iss && <KeyValue label="iss" value={report.iss} />}
            {report.sub && <KeyValue label="sub" value={report.sub} />}
            {report.aud && <KeyValue label="aud" value={report.aud} />}
            {report.ttl && <KeyValue label="TTL (exp − iat)" value={report.ttl} />}
            {claimRow("iat · issued at", report.iat, nowNs)}
            {claimRow("nbf · not before", report.nbf, nowNs)}
            {claimRow("exp · expires at", report.exp, nowNs)}
          </dl>
        </div>
      )}
      <Hint>Milliseconds, seconds, and JSON claims are all accepted. Token inspection happens locally.</Hint>
    </Toolbox>
  );
}

function HttpPanel({ ctx }: { ctx: PanelCtx }) {
  const [text, setText] = useState(
    "Date: Wed, 07 Sep 2026 16:00:00 GMT\nLast-Modified: Tue, 01 Sep 2026 12:00:00 GMT\nExpires: Thu, 08 Sep 2026 16:00:00 GMT\nRetry-After: 120\n",
  );
  const result = useMemo(() => parseHttpTimestamps(text, optsOf(ctx), ctx.nowMs), [text, ctx]);
  const okCount = result.rows.filter((r) => r.ok).length;

  return (
    <Toolbox title="HTTP timestamps · Date / Expires / Last-Modified / Retry-After">
      <textarea
        className={`${inputClass} min-h-28 w-full font-mono text-xs`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Paste HTTP response headers:\nDate: Wed, 07 Sep 2026 16:00:00 GMT\nExpires: …\nRetry-After: 120"}
        aria-label="HTTP headers"
        spellCheck={false}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Stat label="recognized" value={String(okCount)} tone={okCount === result.rows.length && result.rows.length > 0 ? "ok" : "warn"} />
        <Stat label="unparsed" value={String(result.rows.length - okCount)} tone={result.rows.length - okCount > 0 ? "warn" : "default"} />
      </div>
      {result.rows.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                <th className="py-1 pr-2 font-medium">Header</th>
                <th className="py-1 pr-2 font-medium">Value</th>
                <th className="py-1 pr-2 font-medium">UTC</th>
                <th className="py-1 pr-2 font-medium">IST</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, index) => (
                <tr key={index} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-1 pr-2 font-semibold whitespace-nowrap">{row.name}</td>
                  <td className="max-w-48 truncate py-1 pr-2 font-mono" title={row.value}>{row.value}</td>
                  <td className="py-1 pr-2 font-mono whitespace-nowrap">{row.ok ? row.source : <span className="text-red-600 dark:text-red-400">{row.error ?? "unparsed"}</span>}</td>
                  <td className="py-1 pr-2 font-mono whitespace-nowrap">{row.ok && row.ist ? row.ist : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Hint>Also understands iat / exp / nbf claims. Retry-After counts from now.</Hint>
    </Toolbox>
  );
}

function SnippetGroupBlock({ group }: { group: SnippetGroup }) {
  return (
    <section className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-2 dark:border-zinc-800 dark:bg-zinc-900/30">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{group.language}</p>
      <div className="flex flex-col gap-1.5">
        {group.snippets.map((code) => (
          <div key={code} className="flex items-center justify-between gap-2">
            <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-700 dark:text-zinc-200" title={code}>
              {code}
            </code>
            <CopyButton text={code} label="Copy" />
          </div>
        ))}
      </div>
    </section>
  );
}

function DeveloperPanel({ ctx, sharedMs, sharedIso }: { ctx: PanelCtx; sharedMs: number | null; sharedIso: string | null }) {
  const units = useMemo(() => {
    if (sharedMs === null) return null;
    return epochUnits(BigInt(Math.round(sharedMs)) * 1_000_000n);
  }, [sharedMs]);

  if (units === null) {
    return (
      <Toolbox title="Developer code snippets">
        <ErrBox>Enter a valid timestamp in the converter above to generate code snippets for it.</ErrBox>
      </Toolbox>
    );
  }

  const groups = developerSnippets(units.seconds, units.milliseconds, sharedIso);
  const dbGroups = databaseSnippets(units.seconds, sharedIso);

  return (
    <Toolbox
      title={`Developer snippets · ${ctx.primaryTz === IST ? "IST" : ctx.primaryTz}`}
      actions={
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
          epoch s {units.seconds} · ms {units.milliseconds}
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {groups.map((g) => (
          <SnippetGroupBlock key={g.language} group={g} />
        ))}
      </div>
      <details className="mt-3 group rounded-lg border border-zinc-200 dark:border-zinc-800">
        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100">
          Database formats · PostgreSQL · MySQL · MongoDB · Redis
        </summary>
        <div className="grid grid-cols-1 gap-2 border-t border-zinc-100 p-2 dark:border-zinc-800 md:grid-cols-2">
          {dbGroups.map((g) => (
            <SnippetGroupBlock key={g.language} group={g} />
          ))}
        </div>
      </details>
    </Toolbox>
  );
}