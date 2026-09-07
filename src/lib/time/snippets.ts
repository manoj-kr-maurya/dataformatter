/**
 * Developer and database code snippet generators for a resolved instant.
 * Every snippet is a literal string produced from the (possibly BigInt-exact)
 * epoch values, so nothing is sent anywhere.
 */

export interface CodeSnippet {
  language: string;
  direction: string;
  code: string;
}

export interface SnippetGroup {
  language: string;
  snippets: string[];
}

function group(language: string, snippets: string[]): SnippetGroup {
  return { language, snippets };
}

/** Escape bigint-ish but simplify: values are small enough for most snippets. */
export function developerSnippets(seconds: string, milliseconds: string, iso: string | null): SnippetGroup[] {
  const groups: SnippetGroup[] = [
    group("JavaScript", [
      `new Date(${milliseconds}) // ${iso ?? "out of JS Date range"}`,
      `Math.floor(Date.now() / 1000)`,
    ]),
    group("TypeScript", [
      `const date = new Date(${milliseconds}); // ${iso ?? "out of JS Date range"}`,
      `const unixSeconds = Math.floor(Date.now() / 1000);`,
    ]),
    group("Python", [
      `datetime.fromtimestamp(${seconds}, tz=timezone.utc)`,
      `int(datetime.now(tz=timezone.utc).timestamp())`,
    ]),
    group("Java", [
      `Instant.ofEpochSecond(${seconds})`,
      `Instant.now().getEpochSecond()`,
    ]),
    group("Kotlin", [
      `Instant.ofEpochSecond(${seconds})`,
      `Instant.now().epochSecond`,
    ]),
    group("Go", [
      `time.Unix(${seconds}, 0)`,
      `time.Now().Unix()`,
    ]),
    group("C#", [
      `DateTimeOffset.FromUnixTimeSeconds(${seconds})`,
      `DateTimeOffset.FromUnixTimeMilliseconds(${milliseconds})`,
      `DateTimeOffset.UtcNow.ToUnixTimeSeconds()`,
    ]),
    group("PHP", [
      `(new DateTimeImmutable())->setTimestamp(${seconds})`,
      `time()`,
    ]),
    group("Ruby", [
      `Time.at(${seconds})`,
      `Time.now.to_i`,
    ]),
    group("Rust (chrono)", [
      `chrono::DateTime::from_timestamp(${seconds}, 0)`,
      `chrono::Utc::now().timestamp()`,
    ]),
    group("SQL (PostgreSQL)", [
      `SELECT to_timestamp(${seconds});`,
      `SELECT EXTRACT(EPOCH FROM NOW());`,
    ]),
    group("MySQL", [
      `SELECT FROM_UNIXTIME(${seconds});`,
      `SELECT UNIX_TIMESTAMP();`,
    ]),
    group("SQLite", [
      `SELECT datetime(${seconds}, 'unixepoch');`,
      `SELECT strftime('%s', 'now');`,
    ]),
  ];
  return groups;
}

export function databaseSnippets(seconds: string, iso: string | null): SnippetGroup[] {
  const groups: SnippetGroup[] = [
    group("PostgreSQL", [
      `SELECT to_timestamp(${seconds});`,
      `-- now → ${seconds} epoch seconds`,
      `SELECT EXTRACT(EPOCH FROM clock_timestamp())::bigint;`,
    ]),
    group("MySQL", [
      `SELECT FROM_UNIXTIME(${seconds});`,
      `SELECT UNIX_TIMESTAMP();`,
    ]),
    group("SQLite", [
      `SELECT datetime(${seconds}, 'unixepoch');`,
      `SELECT strftime('%s', 'now');`,
    ]),
  ];
  if (iso) {
    groups.push(
      group("MongoDB", [
        `db.orders.insertOne({ createdAt: ISODate("${iso}") })`,
        `db.orders.find({ createdAt: { $gt: ISODate("${iso}") } })`,
      ]),
    );
  }
  groups.push(
    group("Redis", [
      `SET my:item "${seconds}"   # stored as epoch seconds`,
      `EXPIREAT my:item ${seconds}`,
    ]),
  );
  return groups;
}