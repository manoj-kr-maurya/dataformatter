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
  ChevronIcon,
  DiceIcon,
  HashIcon,
  HomeIcon,
  LinkIcon,
  LockIcon,
  TerminalIcon,
  TextIcon,
} from "@/components/ui/icons";
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

type PageHref =
  | "/"
  | "/encode-decode"
  | "/base64"
  | "/json-converter"
  | "/parsers"
  | "/random-generators"
  | "/string-functions"
  | "/cryptography-tools"
  | "/compiler";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** Page-style entry nested under a rail section (e.g. languages under
 *  Compiler). Unlike tools these are plain links, not workspace modes. */
interface RailSubItem {
  id: string;
  label: string;
  /** Defaults to the parent section's page. */
  href?: PageHref;
  title?: string;
}

/** Every tool category lives directly in the sidebar rail as a section with a
 *  hover fly-out of its internal tools. This is the single source of truth for
 *  the desktop rail and the mobile drawer. */
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
      { id: "dart", label: "Dart", title: "Run Dart in your browser" },
    ],
    title: "Compiler — run code in your browser (Dart today, more languages soon)",
  },
];

function sectionActive(section: RailSection, activeHref: PageHref, mode: ToolMode): boolean {
  if (section.mode) {
    return mode === section.mode;
  }
  if (section.id === "home") {
    return activeHref === "/" && mode === AUTO_DETECT;
  }
  return activeHref === section.href;
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
}

export function Sidebar({ activeHref, mode, onSelectTool, open = false, onClose }: SidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [picked, setPicked] = useState(false);
  const [drawerSection, setDrawerSection] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  // Default to the section matching the current page/tool until hovered.
  const shownSectionId = useMemo(
    () => activeId ?? RAIL_SECTIONS.find((s) => sectionActive(s, activeHref, mode))?.id ?? "home",
    [activeId, activeHref, mode],
  );

  useEffect(() => () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
    }
  }, []);

  /** Show the section's fly-out tools for a rail item (or the panel itself). */
  const reveal = useCallback((id: string) => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveId(id);
    setPicked(false);
    setPanelOpen(true);
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
      reveal(section.id);
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
    const active = sectionActive(section, activeHref, mode);
    const inner = (
      <>
        <section.icon className="h-4 w-4 shrink-0" />
        <span className={`w-full truncate text-[10px] leading-tight ${active ? "font-medium" : ""}`}>
          {section.label}
        </span>
      </>
    );
    if (section.mode) {
      return (
        <button
          key={section.id}
          type="button"
          data-rail={section.id}
          aria-label={section.label}
          aria-current={active ? "true" : undefined}
          title={section.title}
          onClick={() => selectTool(section.mode as ToolType)}
          onMouseEnter={() => reveal(section.id)}
          onKeyDown={(event) => handleRailKeyDown(event, section)}
          className={railItemClass(active)}
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
        aria-current={active ? "page" : undefined}
        title={section.title}
        onClick={pick}
        onMouseEnter={() => reveal(section.id)}
        onKeyDown={(event) => handleRailKeyDown(event, section)}
        className={railItemClass(active)}
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
                      {section.tools.map((tool) => (
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
                      ))}
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
          </div>
        </div>
      )}

      {/* Desktop rail — every tool category sits directly in the column, and
          hovering one reveals a fly-out of its internal tools next to it. */}
      <nav
        ref={navRef}
        aria-label="Primary"
        onMouseLeave={scheduleClose}
        className="relative z-30 hidden w-[4.5rem] shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain p-1.5">
          {RAIL_SECTIONS.map((section) => renderRailItem(section))}
        </div>

        {panelOpen && !picked && (
          <div
            ref={panelRef}
            data-tool-flyout
            onKeyDown={handlePanelKeyDown}
            className="menu-in absolute left-[4.75rem] top-2 z-50 w-60 rounded-lg border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="max-h-[70vh] overflow-y-auto">
              {RAIL_SECTIONS.map((section) => {
                const active = sectionActive(section, activeHref, mode);
                const expanded = shownSectionId === section.id;
                const rowInner = (
                  <>
                    <section.icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    <span className="truncate">{section.fullLabel}</span>
                    {expanded && (
                      <ChevronIcon className="ml-auto h-3.5 w-3.5 shrink-0 rotate-90 text-zinc-400 dark:text-zinc-500" />
                    )}
                  </>
                );
                return (
                  <div key={section.id} onMouseEnter={() => reveal(section.id)}>
                    {section.mode ? (
                      <button
                        type="button"
                        aria-current={active ? "true" : undefined}
onClick={() => selectTool(section.mode as ToolType)}
                        className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
                          active
                            ? "font-semibold text-violet-700 dark:text-violet-300"
                            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        }`}
                      >
                        {rowInner}
                      </button>
                    ) : (
                      <Link
                        href={section.href as PageHref}
                        aria-current={active ? "page" : undefined}
                        onClick={pick}
                        className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
                          active
                            ? "font-semibold text-violet-700 dark:text-violet-300"
                            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        }`}
                      >
                        {rowInner}
                      </Link>
                    )}

                    {expanded && (
                      <ul className="mb-1 ml-3 space-y-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                        {section.tools.map((tool) => {
                          const toolActive = mode === tool;
                          return (
                            <li key={tool}>
                              <button
                                type="button"
                                data-tool={tool}
                                onClick={() => selectTool(tool)}
                                className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-500 ${
                                  toolActive
                                    ? "font-medium text-violet-600 dark:text-violet-300"
                                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                }`}
                              >
                                {TOOL_META[tool].label}
                              </button>
                            </li>
                          );
                        })}
                        {(section.subItems ?? []).map((sub) => {
                          const subHref = (sub.href ?? section.href) as PageHref;
                          const subActive = activeHref === subHref;
                          return (
                            <li key={sub.id}>
                              <Link
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
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}