"use client";

import Link from "next/link";
import {
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type SVGProps,
} from "react";
import {
  BracketsIcon,
  BracesIcon,
  DiceIcon,
  HashIcon,
  HomeIcon,
  LayersIcon,
  LockIcon,
  TextIcon,
} from "@/components/ui/icons";
import {
  BASE64_TOOL_ORDER,
  CRYPTOGRAPHY_TOOL_ORDER,
  ENCODE_DECODE_TOOL_ORDER,
  HOME_TOOL_ORDER,
  JSON_CONVERTER_TOOL_ORDER,
  PARSER_TOOL_ORDER,
  RANDOM_GENERATOR_TOOL_ORDER,
  STRING_FUNCTION_TOOL_ORDER,
  TOOL_META,
} from "@/lib/tools";
import type { ToolMode, ToolType } from "@/types/tools";

type PageHref =
  | "/"
  | "/encode-decode"
  | "/base64"
  | "/json-converter"
  | "/parsers"
  | "/random-generators"
  | "/string-functions"
  | "/cryptography-tools";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const NAV_LINKS: Array<{ href: PageHref; label: string; Icon: IconComponent }> = [
  { href: "/", label: "DevTools Home", Icon: HomeIcon },
  { href: "/encode-decode", label: "Encoding Tools", Icon: LayersIcon },
  { href: "/base64", label: "Base64 Tools", Icon: HashIcon },
  { href: "/json-converter", label: "JSON Converters", Icon: BracesIcon },
  { href: "/parsers", label: "Parsers", Icon: BracketsIcon },
  { href: "/random-generators", label: "Random Tools", Icon: DiceIcon },
  { href: "/string-functions", label: "String Functions", Icon: TextIcon },
  { href: "/cryptography-tools", label: "Cryptography", Icon: LockIcon },
];

/** The manual tools that live under each sidebar section. */
const SECTION_TOOLS: Record<PageHref, ToolType[]> = {
  "/": HOME_TOOL_ORDER,
  "/encode-decode": ENCODE_DECODE_TOOL_ORDER,
  "/base64": BASE64_TOOL_ORDER,
  "/json-converter": JSON_CONVERTER_TOOL_ORDER,
  "/parsers": PARSER_TOOL_ORDER,
  "/random-generators": RANDOM_GENERATOR_TOOL_ORDER,
  "/string-functions": STRING_FUNCTION_TOOL_ORDER,
  "/cryptography-tools": CRYPTOGRAPHY_TOOL_ORDER,
};

interface SidebarProps {
  activeHref: PageHref;
  onSelectTool: (mode: ToolMode) => void;
  /** Mobile drawer visibility; the drawer is only rendered below `sm`. */
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeHref, onSelectTool, open = false, onClose }: SidebarProps) {
  const [openSection, setOpenSection] = useState<PageHref>(activeHref);
  const [picked, setPicked] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const linkClass = (active: boolean) =>
    `flex h-9 items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
      active
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    }`;

  // Arrow-key navigation within the hover panel: Up/Down move between items,
  // Right expands a section (focusing its first tool), Left collapses back to
  // the section row.
  function handlePanelKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    const root = panelRef.current;
    if (!root) {
      return;
    }
    const items = Array.from(root.querySelectorAll<HTMLElement>("a, button"));
    const current = document.activeElement as HTMLElement | null;
    const index = current ? items.indexOf(current) : -1;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
      return;
    }
    if (event.key === "ArrowRight") {
      const link = current?.closest<HTMLElement>("a[data-section]");
      if (link) {
        event.preventDefault();
        const href = link.dataset.section as PageHref;
        setOpenSection(href);
        requestAnimationFrame(() => {
          link.parentElement?.querySelector<HTMLElement>("button")?.focus();
        });
      }
      return;
    }
    if (event.key === "ArrowLeft") {
      const button = current?.closest<HTMLElement>("button");
      if (button) {
        event.preventDefault();
        const row = button.closest("div");
        const link = row?.querySelector<HTMLElement>("a[data-section]");
        if (link) {
          const href = link.dataset.section as PageHref;
          setOpenSection(href);
          link.focus();
        }
      }
    }
  }

  // Navigate between the rail icons with Up/Down and drill into a section's
  // tools with ArrowRight — keeps the panel fully keyboard-usable without
  // tabbing through every icon first.
  function handleRailKeyDown(event: ReactKeyboardEvent<HTMLElement>, href: PageHref) {
    const links = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-rail]`),
    );
    const current = event.currentTarget as HTMLElement;
    const index = links.indexOf(current);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      links[(index + 1) % links.length]?.focus();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      links[(index - 1 + links.length) % links.length]?.focus();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setOpenSection(href);
      setPicked(false);
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(`[data-section="${href}"]`)
          ?.closest("div")
          ?.querySelector<HTMLElement>("button")
          ?.focus();
      });
    }
  }

  return (
    <>
      {/* Mobile drawer nav — only below `sm`, where the rail is hidden. */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Tools navigation"
        >
          <div
            className="absolute inset-0 bg-zinc-900/30"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 top-12 w-72 overflow-y-auto border-r border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            {NAV_LINKS.map(({ href, label, Icon }) => {
              const active = href === activeHref;
              return (
                <div key={href} className="mb-4">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
                      active ? "font-semibold" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    {label}
                  </Link>
                  <ul className="ml-3 mt-1 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                    {SECTION_TOOLS[href].map((id) => (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTool(id);
                            onClose?.();
                          }}
                          className="w-full rounded-md px-2 py-1.5 text-left text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        >
                          {TOOL_META[id].label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <nav
      aria-label="Pages"
      onMouseLeave={() => {
        setOpenSection(activeHref);
        setPicked(false);
      }}
      className="group relative z-30 hidden w-14 shrink-0 border-r border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40 sm:block"
    >
      <ul className="flex w-14 flex-col gap-1 p-2">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = href === activeHref;
          return (
            <li key={href}>
              <Link
                href={href}
                data-rail={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                title={label}
                onMouseEnter={() => {
                  setOpenSection(href);
                  setPicked(false);
                }}
                onKeyDown={(event) => handleRailKeyDown(event, href)}
                className={linkClass(active)}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Hover/focus panel — shown via CSS :hover/:focus-within so the current
          page's tool list appears the moment the rail (or this panel) is
          hovered or keyboard-focused. Closes after a tool is picked. */}
      {!picked && (
        <div className="absolute left-12 top-2 hidden pl-1 group-hover:block group-focus-within:block">
          <div
            ref={panelRef}
            onKeyDown={handlePanelKeyDown}
            className="menu-in w-52 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="max-h-[70vh] overflow-y-auto">
              {NAV_LINKS.map(({ href, label, Icon }) => {
                const active = href === activeHref;
                return (
                  <div key={href} onMouseEnter={() => setOpenSection(href)}>
                    <Link
                      href={href}
                      data-section={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${
                        active ? "font-semibold" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                      {label}
                      {openSection === href && (
                        <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      )}
                    </Link>

                    {openSection === href && (
                      <ul className="mb-1 ml-3 space-y-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                        {SECTION_TOOLS[href].map((id) => (
                          <li key={id}>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectTool(id);
                                setPicked(true);
                                requestAnimationFrame(() => {
                                  document
                                    .querySelector<HTMLElement>(`[data-rail="${href}"]`)
                                    ?.focus();
                                });
                              }}
                              className="w-full rounded-md px-3 py-1.5 text-left text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            >
                              {TOOL_META[id].label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
    </>
  );
}

function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}