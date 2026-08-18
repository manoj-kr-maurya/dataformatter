"use client";

import Link from "next/link";
import { useState, type ComponentType, type SVGProps } from "react";
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
}

export function Sidebar({ activeHref, onSelectTool }: SidebarProps) {
  const [openSection, setOpenSection] = useState<PageHref>(activeHref);

  const linkClass = (active: boolean) =>
    `flex h-9 items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
      active
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    }`;

  return (
    <nav
      aria-label="Pages"
      onMouseLeave={() => setOpenSection(activeHref)}
      className="group relative z-30 hidden w-14 shrink-0 border-r border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40 sm:block"
    >
      <ul className="flex w-14 flex-col gap-1 p-2">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = href === activeHref;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                title={label}
                onMouseEnter={() => setOpenSection(href)}
                className={linkClass(active)}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Hover panel — shown via CSS :hover so the current page's tool list
          appears the moment the rail (or this panel) is hovered. */}
      <div className="absolute left-12 top-2 hidden pl-1 group-hover:block">
        <div className="w-52 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="max-h-[70vh] overflow-y-auto">
            {NAV_LINKS.map(({ href, label, Icon }) => {
              const active = href === activeHref;
              return (
                <div key={href} onMouseEnter={() => setOpenSection(href)}>
                  <Link
                    href={href}
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
                            onClick={() => onSelectTool(id)}
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
    </nav>
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