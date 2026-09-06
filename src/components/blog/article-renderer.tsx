import type { BlogBlock } from "@/lib/blog/types";
import { Bullets, CompareTable, Example, Glossary, Faq } from "@/components/seo/content-blocks";

/** Stable URL fragment for a heading — shared by the TOC and the block renderer. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function CodeBlock({ label, code }: { label?: string; code: string }) {
  return (
    <figure className="mt-3">
      {label && (
        <figcaption className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {label}
        </figcaption>
      )}
      <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

function Note({ title, text }: { title: string; text: string }) {
  return (
    <aside className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-amber-900/80 dark:text-amber-200/80">{text}</p>
    </aside>
  );
}

function ArticleBlock({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "p":
      return <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">{block.text}</p>;
    case "h2":
      return (
        <h2
          id={slugifyHeading(block.text)}
          className="mt-8 scroll-mt-20 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {block.text}
        </h3>
      );
    case "ul":
      return <Bullets items={block.items} />;
    case "ol":
      return (
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-zinc-600 dark:text-zinc-400">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "code":
      return <CodeBlock label={block.label} code={block.code} />;
    case "example":
      return (
        <Example
          inputLabel={block.inputLabel}
          input={block.input}
          outputLabel={block.outputLabel}
          output={block.output}
        />
      );
    case "table":
      return (
        <CompareTable headers={block.headers} rows={block.rows} caption={block.caption} />
      );
    case "glossary":
      return <Glossary terms={block.terms} />;
    case "note":
      return <Note title={block.title} text={block.text} />;
    case "faq":
      return <Faq items={block.items} />;
  }
}

/** Renders the data-defined blocks of an article in order, as crawlable HTML. */
export function ArticleBlocks({ blocks }: { blocks: readonly BlogBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => (
        <ArticleBlock key={`${block.type}-${index}`} block={block} />
      ))}
    </div>
  );
}