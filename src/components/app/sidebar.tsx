"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type SVGProps,
} from "react";
import {
  BinaryIcon,
  BracesIcon,
  BracketsIcon,
  BugIcon,
  CalculatorIcon,
  ChevronIcon,
  ClockIcon,
  DiceIcon,
  GlobeIcon,
  HashIcon,
  HomeIcon,
  LinkIcon,
  LockIcon,
  PanelIcon,
  TerminalIcon,
  TextIcon,
} from "@/components/ui/icons";
import { Logo } from "@/components/brand/logo";
import { usePersistedState } from "@/hooks/usePersistedState";
import {
  AUTO_DETECT,
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

export type PageHref =
  | "/"
  | "/encode-decode"
  | "/base64"
  | "/json-converter"
  | "/parsers"
  | "/random-generators"
  | "/string-functions"
  | "/cryptography-tools"
  | "/compiler"
  | "/api-client"
  | "/api-tester"
  | "/openapi"
  | "/json-diff"
  | "/har"
  | "/api-diff"
  | "/error-workspace"
  | "/json-to-code"
  | "/json-to-schema"
  | "/curl-to-code"
  | "/http-header-inspector"
  | "/log-analyzer"
  | "/stack-trace"
  | "/env-validator"
  | "/cron"
  | "/timestamp"
  | "/regex"
  | "/fake-data"
  | "/developer-calculator";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** Page-style entry nested under a rail section (e.g. languages under
 *  Compiler). Unlike tools these are plain links, not workspace modes. */
interface RailSubItem {
  id: string;
  label: string;
  /** Defaults to the parent section's page. May carry a query (e.g. ?lang=). */
  href?: string;
  title?: string;
}

/** Every tool category lives directly in the sidebar rail as a section whose
 *  internal tools open in a hover fly-out beside it. This is the single source
 *  of truth for the desktop rail and the mobile drawer. */
interface RailSection {
  id: string;
  /** Short label shown on the compact rail. */
  label: string;
  /** Full label used by the fly-out and the drawer. */
  fullLabel: string;
  icon: IconComponent;
  /** Page the section opens when clicked. */
  href?: PageHref;
  /** Tool the section selects directly when clicked (no dedicated page). */
  mode?: ToolMode;
  /** The section's internal tools, revealed on hover. */
  tools: ToolType[];
  /** Nested page entries rendered under the section's tools. */
  subItems?: RailSubItem[];
  title: string;
}

const RAIL_SECTIONS: RailSection[] = [
  {
    id: "home",
    label: "Home",
    fullLabel: "DevTools Home",
    icon: HomeIcon,
    href: "/",
    tools: HOME_TOOL_ORDER,
    title: "Home — automatic detection",
  },
  {
    id: "json",
    label: "JSON",
    fullLabel: "JSON Converters",
    icon: BracesIcon,
    href: "/json-converter",
    tools: JSON_CONVERTER_TOOL_ORDER,
    title: "JSON Converters",
  },
  {
    id: "base64",
    label: "Base64",
    fullLabel: "Base64 Tools",
    icon: BinaryIcon,
    href: "/base64",
    tools: BASE64_TOOL_ORDER,
    title: "Base64 Tools",
  },
  {
    id: "jwt",
    label: "JWT",
    fullLabel: "JWT Decode",
    icon: LockIcon,
    mode: "JWT_DECODE",
    tools: ["JWT_DECODE"],
    title: "JWT — decode a token",
  },
  {
    id: "url",
    label: "URL",
    fullLabel: "Encoding Tools",
    icon: LinkIcon,
    href: "/encode-decode",
    tools: ENCODE_DECODE_TOOL_ORDER,
    title: "Encoding Tools",
  },
  {
    id: "hash",
    label: "Hash",
    fullLabel: "Cryptography",
    icon: HashIcon,
    href: "/cryptography-tools",
    tools: CRYPTOGRAPHY_TOOL_ORDER,
    title: "Cryptography",
  },
  {
    id: "parsers",
    label: "Parsers",
    fullLabel: "Parsers",
    icon: BracketsIcon,
    href: "/parsers",
    tools: PARSER_TOOL_ORDER,
    title: "Parsers",
  },
  {
    id: "random",
    label: "Random",
    fullLabel: "Random Tools",
    icon: DiceIcon,
    href: "/random-generators",
    tools: RANDOM_GENERATOR_TOOL_ORDER,
    subItems: [
      { id: "fake-data", href: "/fake-data", label: "Fake Data", title: "Generate realistic fake data in your browser" },
    ],
    title: "Random Tools",
  },
  {
    id: "string",
    label: "String",
    fullLabel: "String Functions",
    icon: TextIcon,
    href: "/string-functions",
    tools: STRING_FUNCTION_TOOL_ORDER,
    title: "String Functions",
  },
  {
    id: "compiler",
    label: "Compiler",
    fullLabel: "Compiler",
    icon: TerminalIcon,
    href: "/compiler",
    tools: [],
    subItems: [
      { id: "dart", href: "/compiler?lang=dart", label: "Dart", title: "Run Dart in your browser" },
      {
        id: "js",
        href: "/compiler?lang=js",
        label: "JavaScript",
        title: "Run JavaScript in a sandboxed worker",
      },
      {
        id: "ts",
        href: "/compiler?lang=ts",
        label: "TypeScript",
        title: "Transpile & run TypeScript in your browser",
      },
    ],
    title: "Compiler — run Dart, JavaScript and TypeScript in your browser",
  },
  {
    id: "api",
    label: "API",
    fullLabel: "API Client",
    icon: GlobeIcon,
    href: "/api-client",
    tools: [],
    subItems: [
      { id: "rest", label: "REST", title: "Build & send HTTP requests in your browser" },
      { id: "api-tester", href: "/api-tester", label: "API Tester", title: "Send & debug HTTP requests in your browser" },
      {
        id: "openapi",
        href: "/openapi",
        label: "OpenAPI",
        title: "View, validate & generate code from OpenAPI documents",
      },
      {
        id: "http-headers",
        href: "/http-header-inspector",
        label: "HTTP Headers",
        title: "Analyze cached or captured HTTP headers",
      },
    ],
    title: "API Client — build & send HTTP requests entirely in your browser",
  },
  {
    id: "converters",
    label: "Converters",
    fullLabel: "Converters",
    icon: CalculatorIcon,
    href: "/json-to-code",
    tools: [],
    subItems: [
      {
        id: "json-to-code",
        href: "/json-to-code",
        label: "JSON to Code",
        title: "Generate type declarations from JSON samples",
      },
      {
        id: "json-to-schema",
        href: "/json-to-schema",
        label: "JSON to Schema",
        title: "Derive validation schemas (JSON Schema, Zod, Pydantic)",
      },
      {
        id: "curl-to-code",
        href: "/curl-to-code",
        label: "cURL to Code",
        title: "Convert cURL commands to JavaScript, Python & more",
      },
      {
        id: "developer-calculator",
        href: "/developer-calculator",
        label: "Developer Calculator",
        title: "Hex, bytes, percent & CRC-32 — built for developers",
      },
    ],
    title: "Converters — JSON to code, schemas, cURL and the developer calculator",
  },
  {
    id: "debug",
    label: "Debug",
    fullLabel: "Debug Tools",
    icon: BugIcon,
    href: "/json-diff",
    tools: [],
    subItems: [
      { id: "json-diff", href: "/json-diff", label: "JSON Diff", title: "Compare two JSON documents" },
      { id: "har", href: "/har", label: "HAR Debugger", title: "Analyze network captures & HAR files" },
      { id: "api-diff", href: "/api-diff", label: "API Diff", title: "Detect breaking changes between JSON APIs" },
      { id: "error-workspace", href: "/error-workspace", label: "Error Workspace", title: "Debug production errors, logs & stack traces" },
      { id: "log-analyzer", href: "/log-analyzer", label: "Log Analyzer", title: "Count errors & spot spikes in logs" },
      { id: "stack-trace", href: "/stack-trace", label: "Stack Trace", title: "Read Java, JS, Python & Go stack traces" },
      { id: "env-validator", href: "/env-validator", label: "ENV Validator", title: "Validate & diff .env files locally" },
      { id: "regex", href: "/regex", label: "Regex Tester", title: "Test regular expressions locally" },
    ],
    title: "Debug — inspect HAR captures, detect API breaking changes, debug errors, diff JSON, analyze logs and traces, validate env & regex",
  },
  {
    id: "time",
    label: "Time",
    fullLabel: "Time Tools",
    icon: ClockIcon,
    href: "/timestamp",
    tools: [],
    subItems: [
      { id: "timestamp", href: "/timestamp", label: "Timestamp", title: "Convert Unix time, ISO and HTTP dates" },
      { id: "cron", href: "/cron", label: "Cron", title: "Validate, describe & schedule cron expressions" },
    ],
    title: "Time — timestamp conversion and cron expression scheduling",
  },
];

function sectionActive(section: RailSection, activeHref: PageHref, mode: ToolMode): boolean {
  if (section.mode) {
    return mode === section.mode;
  }
  if (section.id === "home") {
    return activeHref === "/" && mode === AUTO_DETECT;
  }
  return (
    activeHref === section.href ||
    (section.subItems ?? []).some((sub) => sub.href === activeHref)
  );
}

/** Sections whose contents are worth a fly-out hint on the rail itself. */
function sectionHasChildren(section: RailSection): boolean {
  return section.tools.length > 1 || (section.subItems?.length ?? 0) > 0;
}

/**
 * Page that hosts a tool. Used by shells without a workspace (e.g. the
 * compiler playground) so picking a fly-out tool still lands somewhere
 * useful — the target page opens with auto-detect, which selects it.
 */
export function pageHrefForTool(tool: ToolMode): PageHref {
  const section = RAIL_SECTIONS.find((entry) => entry.tools.includes(tool as ToolType));
  // Sections without a dedicated page (JWT) are reachable from home.
  return section?.href ?? "/";
}

function focusRail(id: string) {
  document.querySelector<HTMLElement>(`[data-rail="${id}"]`)?.focus();
}

interface SidebarProps {
  activeHref: PageHref;
  mode: ToolMode;
  onSelectTool: (mode: ToolMode) => void;
  /** Mobile drawer visibility; the drawer is only rendered below `sm`. */
  open?: boolean;
  onClose?: () => void;
  /** When true, tool clicks navigate to the section's page instead of calling onSelectTool. Use on standalone workbench pages (HAR, API-Diff, Error-Workspace) where there is no tool-switching workspace. */
  standalone?: boolean;
}

export function Sidebar({ activeHref, mode, onSelectTool, open = false, onClose, standalone }: SidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [picked, setPicked] = useState(false);
  const [drawerSection, setDrawerSection] = useState<string | null>(null);
  // Collapsed rail keeps its width budget tiny (~64px) and shows icons only.
  const [railCollapsed, setRailCollapsed] = usePersistedState<boolean>("devtools-rail-collapsed", false);
  // Vertical anchor of the fly-out: the hovered item's offset inside the rail,
  // plus a fitted variant clamped after the panel's real height is known.
  const [anchorTop, setAnchorTop] = useState(8);
  const [fittedTop, setFittedTop] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  const activeSection = useMemo(
    () => RAIL_SECTIONS.find((s) => s.id === activeId) ?? null,
    [activeId],
  );

  useEffect(() => () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
    }
  }, []);

  /** Show the section's fly-out tools for a rail item (or the panel itself). */
  const reveal = useCallback((id: string, itemEl?: HTMLElement | null) => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveId(id);
    setPicked(false);
    setPanelOpen(true);
    if (itemEl && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      setAnchorTop(Math.max(8, itemEl.getBoundingClientRect().top - navRect.top - 6));
      setFittedTop(null);
    }
  }, []);

  /** Collapse the fly-out after the pointer leaves the rail/panel. */
  const scheduleClose = useCallback(() => {
    if (closeTimer.current !== null) {
      return;
    }
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setPanelOpen(false);
    }, 140);
  }, []);

  /** Pointer entered the fly-out — cancel any pending close. */
  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  /** Hide the fly-out for good until the next hover (after picking/navigating). */
  const pick = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setPicked(true);
    setPanelOpen(false);
  }, []);

  const selectTool = useCallback(
    (tool: ToolType) => {
      onSelectTool(tool);
      pick();
    },
    [onSelectTool, pick],
  );

  // Clamp the fly-out vertically once its real height is measurable, so long
  // lists stay inside the viewport instead of running past the fold.
  useEffect(() => {
    if (!panelOpen || !navRef.current || !panelRef.current) {
      return;
    }
    const maxHeight = navRef.current.clientHeight - panelRef.current.offsetHeight - 12;
    setFittedTop(anchorTop > maxHeight ? Math.max(8, maxHeight) : null);
  }, [panelOpen, anchorTop, activeId]);

  // Outside clicks and Escape close the fly-out.
  useEffect(() => {
    if (!panelOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPanelOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen]);

  // Escape closes the mobile drawer too.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => {
      drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  function handleRailKeyDown(event: ReactKeyboardEvent<HTMLElement>, section: RailSection) {
    const rails = Array.from(document.querySelectorAll<HTMLElement>("[data-rail]"));
    const index = rails.indexOf(event.currentTarget as HTMLElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      rails[(index + 1) % rails.length]?.focus();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      rails[(index - 1 + rails.length) % rails.length]?.focus();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      reveal(section.id, event.currentTarget);
      requestAnimationFrame(() => {
        panelRef.current?.querySelector<HTMLElement>("[data-tool]")?.focus();
      });
    }
    if ((event.key === "ArrowLeft" || event.key === "Escape") && panelOpen) {
      event.preventDefault();
      setPanelOpen(false);
      focusRail(section.id);
    }
  }

  function handlePanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
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
    if (event.key === "ArrowLeft" || event.key === "Escape") {
      event.preventDefault();
      setPanelOpen(false);
      if (activeId) {
        focusRail(activeId);
      }
    }
    if (event.key === "Tab") {
      setPanelOpen(false);
    }
  }

  const railItemClass = (active: boolean) =>
    `flex w-full flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
      active
        ? "bg-violet-500/15 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    }`;

  const renderRailItem = (section: RailSection) => {
    const highlighted =
      sectionActive(section, activeHref, mode) || (panelOpen && activeId === section.id);
    const inner = (
      <>
        <section.icon className="h-4 w-4 shrink-0" />
        {!railCollapsed ? (
          <span className={`flex w-full items-center justify-center gap-0.5 ${highlighted ? "font-medium" : ""}`}>
            <span className="min-w-0 truncate text-[10px] leading-tight">{section.label}</span>
            {sectionHasChildren(section) && (
              <ChevronIcon className="h-2.5 w-2.5 shrink-0 rotate-90 text-zinc-400 dark:text-zinc-500" />
            )}
          </span>
        ) : (
          <span className="sr-only">{section.label}</span>
        )}
      </>
    );
    if (section.mode) {
      if (standalone) {
        return (
          <Link
            key={section.id}
            href={(section.href ?? "/") as PageHref}
            data-rail={section.id}
            aria-label={section.label}
            aria-current={highlighted ? "page" : undefined}
            title={section.title}
            onClick={pick}
            onMouseEnter={(event) => reveal(section.id, event.currentTarget)}
            onKeyDown={(event) => handleRailKeyDown(event, section)}
            className={railItemClass(highlighted)}
          >
            {inner}
          </Link>
        );
      }
      return (
        <button
          key={section.id}
          type="button"
          data-rail={section.id}
          aria-label={section.label}
          aria-current={highlighted ? "true" : undefined}
          title={section.title}
          onClick={() => selectTool(section.mode as ToolType)}
          onMouseEnter={(event) => reveal(section.id, event.currentTarget)}
          onKeyDown={(event) => handleRailKeyDown(event, section)}
          className={railItemClass(highlighted)}
        >
          {inner}
        </button>
      );
    }
    return (
      <Link
        key={section.id}
        href={section.href as PageHref}
        data-rail={section.id}
        aria-label={section.label}
        aria-current={sectionActive(section, activeHref, mode) ? "page" : undefined}
        title={section.title}
        onClick={pick}
        onMouseEnter={(event) => reveal(section.id, event.currentTarget)}
        onKeyDown={(event) => handleRailKeyDown(event, section)}
        className={railItemClass(highlighted)}
      >
        {inner}
      </Link>
    );
  };

  const drawerItemClass = (active: boolean) =>
    `flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
      active
        ? "bg-violet-500/15 font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  const toggleButton = (
    <button
      type="button"
      aria-label={railCollapsed ? "Show Sidebar" : "Hide Sidebar"}
      title={railCollapsed ? "Show Sidebar" : "Hide Sidebar"}
      onClick={() => {
        setPanelOpen(false);
        setRailCollapsed(!railCollapsed);
      }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      <PanelIcon className="h-4 w-4" />
    </button>
  );

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
          <div
            ref={drawerRef}
            className="absolute inset-y-0 left-0 top-12 w-72 overflow-y-auto border-r border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {RAIL_SECTIONS.map((section) => {
              const active = sectionActive(section, activeHref, mode);
              const expanded = drawerSection === section.id;
              const rowInner = (
                <>
                  <section.icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                  <span className="truncate">{section.fullLabel}</span>
                </>
              );
              return (
                <div key={section.id}>
                  <div className="flex items-center gap-1">
                    {section.mode ? (
                      standalone ? (
                        <Link
                          href={(section.href ?? "/") as PageHref}
                          aria-current={active ? "page" : undefined}
                          onClick={onClose}
                          className={drawerItemClass(active)}
                        >
                          {rowInner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          aria-current={active ? "true" : undefined}
                          onClick={() => {
                            onSelectTool(section.mode as ToolMode);
                            onClose?.();
                          }}
                          className={drawerItemClass(active)}
                        >
                          {rowInner}
                        </button>
                      )
                    ) : (
                      <Link
                        href={section.href as PageHref}
                        aria-current={active ? "page" : undefined}
                        onClick={onClose}
                        className={drawerItemClass(active)}
                      >
                        {rowInner}
                      </Link>
                    )}
                    {(section.tools.length > 1 || (section.subItems?.length ?? 0) > 0) && (
                      <button
                        type="button"
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${section.fullLabel}`}
                        aria-expanded={expanded}
                        onClick={() => setDrawerSection(expanded ? null : section.id)}
                        className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      >
                        <ChevronIcon
                          className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                  {expanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                      {section.tools.map((tool) => {
                        if (standalone) {
                          return (
                            <Link
                              key={tool}
                              href={pageHrefForTool(tool)}
                              onClick={onClose}
                              className={drawerItemClass(mode === tool)}
                            >
                              <span className="truncate">{TOOL_META[tool].label}</span>
                            </Link>
                          );
                        }
                        return (
                          <button
                            key={tool}
                            type="button"
                            onClick={() => {
                              onSelectTool(tool);
                              onClose?.();
                            }}
                            className={drawerItemClass(mode === tool)}
                          >
                            <span className="truncate">{TOOL_META[tool].label}</span>
                          </button>
                        );
                      })}
                      {(section.subItems ?? []).map((sub) => {
                        const subHref = (sub.href ?? section.href) as PageHref;
                        return (
                          <Link
                            key={sub.id}
                            href={subHref}
                            title={sub.title}
                            aria-current={activeHref === subHref ? "page" : undefined}
                            onClick={onClose}
                            className={drawerItemClass(activeHref === subHref)}
                          >
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Meta pages — mirrors the desktop rail's About/Contact row. */}
            <div className="mt-2 flex items-center gap-2 border-t border-zinc-200 px-2 pt-2 dark:border-zinc-800">
              <Link
                href="/about"
                onClick={onClose}
                className="rounded px-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-zinc-500 dark:hover:text-violet-300"
              >
                About
              </Link>
              <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">·</span>
              <Link
                href="/contact"
                onClick={onClose}
                className="rounded px-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-zinc-500 dark:hover:text-violet-300"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop rail — every tool category sits directly in the column, and
          hovering one reveals ITS OWN fly-out of internal tools floating over
          the main content (never widening the rail or shifting the page). The
          header hosts the brand mark and the collapse toggle; the collapsed
          rail is icons-only (~64px) with tooltips carrying the names. */}
      <nav
        ref={navRef}
        aria-label="Primary"
        onMouseLeave={scheduleClose}
        className={`relative z-30 hidden shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex ${
          railCollapsed ? "w-16" : "w-[4.5rem]"
        }`}
      >
        {/* Branding + collapse toggle */}
        <div
          className={`flex shrink-0 items-center border-b border-zinc-200 dark:border-zinc-800 ${
            railCollapsed ? "flex-col gap-1 px-1 py-2" : "justify-between px-2 py-2"
          }`}
        >
          <Link
            href="/"
            aria-label="DataFormatter home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            <Logo className="h-7 w-7 rounded-md [&>svg]:h-4 [&>svg]:w-4" />
          </Link>
          {toggleButton}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain p-1.5">
          {RAIL_SECTIONS.map((section) => renderRailItem(section))}
        </div>

        {/* Meta pages — the only in-app entry points to /about and /contact. */}
        <div className="flex shrink-0 flex-col items-center gap-0.5 border-t border-zinc-200 px-1 py-1.5 dark:border-zinc-800">
          <Link
            href="/about"
            className="rounded px-2 py-0.5 text-[10px] font-medium text-zinc-400 transition-colors hover:text-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-zinc-500 dark:hover:text-violet-300"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="rounded px-2 py-0.5 text-[10px] font-medium text-zinc-400 transition-colors hover:text-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-zinc-500 dark:hover:text-violet-300"
          >
            Contact
          </Link>
        </div>

        {panelOpen && !picked && activeSection && (
          <div
            ref={panelRef}
            data-tool-flyout
            onKeyDown={handlePanelKeyDown}
            onMouseEnter={cancelClose}
            style={{ top: fittedTop ?? anchorTop }}
            className="menu-in absolute left-full z-50 ml-1.5 w-60 rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <activeSection.icon className="h-4 w-4 shrink-0 text-violet-500 dark:text-violet-300" />
              <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {activeSection.fullLabel}
              </span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-1">
              {activeSection.tools.map((tool) => {
                const toolActive = mode === tool;
                const toolClass = `block w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
                  toolActive
                    ? "font-medium text-violet-600 dark:text-violet-300"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`;
                if (standalone) {
                  return (
                    <Link
                      key={tool}
                      href={pageHrefForTool(tool)}
                      data-tool={tool}
                      onClick={pick}
                      className={toolClass}
                    >
                      {TOOL_META[tool].label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={tool}
                    type="button"
                    data-tool={tool}
                    onClick={() => selectTool(tool)}
                    className={toolClass}
                  >
                    {TOOL_META[tool].label}
                  </button>
                );
              })}
              {(activeSection.subItems ?? []).map((sub) => {
                const subHref = (sub.href ?? activeSection.href) as PageHref;
                const subActive = activeHref === subHref;
                return (
                  <Link
                    key={sub.id}
                    href={subHref}
                    title={sub.title}
                    aria-current={subActive ? "page" : undefined}
                    onClick={pick}
                    className={`block w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
                      subActive
                        ? "font-medium text-violet-600 dark:text-violet-300"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    }`}
                  >
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
