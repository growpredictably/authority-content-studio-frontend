"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Sparkles,
  PenTool,
  FolderOpen,
  FolderKanban,
  UserCircle,
  LayoutTemplate,
  BarChart3,
  TrendingUp,
  Package,
  Target,
  Radar,
  Users,
  Layers,
  Mic,
  Brain,
  Rocket,
  Settings,
  FileText,
  AudioWaveform,
  Plug,
  Shield,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useUserRole } from "@/lib/api/hooks/use-user-role";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { label: "Command Center", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Create & Publish",
    items: [
      { label: "New Content", href: "/content/angles", icon: PenTool },
      { label: "All Content", href: "/content", icon: FolderKanban },
      { label: "Drafts", href: "/content/drafts", icon: FolderOpen },
      { label: "Market Hunter", href: "/content/market-analysis", icon: TrendingUp },
    ],
  },
  {
    label: "LinkedIn",
    items: [
      { label: "Profile Optimizer", href: "/optimizer", icon: UserCircle },
      { label: "Templates", href: "/linkedin/templates", icon: LayoutTemplate },
      { label: "Performance", href: "/linkedin/performance", icon: BarChart3 },
    ],
  },
  {
    label: "Authority Engine",
    items: [
      { label: "Overview", href: "/authority/overview", icon: TrendingUp },
      { label: "Authority Packets", href: "/authority/packets", icon: Package },
      { label: "Gap Analysis", href: "/authority/gaps", icon: Target },
      { label: "Evidence Feed", href: "/authority/evidence", icon: Radar },
      { label: "ICPs", href: "/authority/icps", icon: Users },
      { label: "Frameworks", href: "/authority/frameworks", icon: Layers },
    ],
  },
  {
    label: "Foundation",
    items: [
      { label: "Voice Builder", href: "/voice", icon: Mic },
      { label: "Voice Profile", href: "/voice/profiles", icon: AudioWaveform },
      { label: "Transcriptions", href: "/voice/transcriptions", icon: FileText },
      { label: "Brain Builder", href: "/brain", icon: Brain },
    ],
  },
  {
    label: "",
    items: [
      { label: "Get Started", href: "/onboarding", icon: Rocket },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Integrations", href: "/integrations", icon: Plug },
    ],
  },
];

const SIDEBAR_SECTIONS_KEY = "sidebar-collapsed-sections";
const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { data: roleData } = useUserRole();

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const storedSections = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
      if (storedSections) {
        setCollapsedSections(JSON.parse(storedSections));
      }
      const storedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (storedCollapsed === "true") {
        setCollapsed(true);
      }
    } catch { /* ignore corrupt data */ }
    setHydrated(true);
  }, []);

  // Persist section collapse state
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(collapsedSections));
    }
  }, [collapsedSections, hydrated]);

  // Persist sidebar collapse state
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    }
  }, [collapsed, hydrated]);

  // Keyboard shortcut: Ctrl+\ or Cmd+\ to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/content") return pathname === "/content";
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Content pipeline pages (angles/outline/write) highlight "New Content"
  function isContentActive() {
    return (
      pathname.startsWith("/content/angles") ||
      pathname.startsWith("/content/outline") ||
      pathname.startsWith("/content/write")
    );
  }

  // Auto-expand section containing the active page (only when expanded)
  useEffect(() => {
    if (!hydrated || collapsed) return;
    for (const group of navGroups) {
      if (!group.label) continue;
      const hasActivePage = group.items.some((item) =>
        item.href === "/content/angles" ? isContentActive() : isActive(item.href)
      );
      if (hasActivePage && collapsedSections[group.label]) {
        setCollapsedSections((prev) => ({ ...prev, [group.label]: false }));
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hydrated]);

  const toggleSection = (label: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  function renderNavItem(item: NavItem) {
    const active =
      item.href === "/content/angles"
        ? isContentActive()
        : isActive(item.href);

    const link = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center rounded-md text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          collapsed ? "justify-center p-2" : "gap-2 px-3 py-2",
          active &&
            "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <span className="flex-1 whitespace-nowrap overflow-hidden">
            {item.label}
          </span>
        )}
        {!collapsed && item.badge && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{link}</div>;
  }

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:border-r md:bg-sidebar md:text-sidebar-foreground transition-[width] duration-200 ease-out overflow-hidden",
        collapsed ? "md:w-14" : "md:w-64"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-14 items-center border-b shrink-0",
          collapsed ? "justify-center px-0" : "px-4"
        )}
      >
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          {!collapsed && (
            <span className="whitespace-nowrap overflow-hidden">
              Authority Studio
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto space-y-1",
          collapsed ? "p-1.5" : "p-3 space-y-4"
        )}
      >
        {navGroups.map((group, groupIndex) => {
          const key =
            group.label || `ungrouped-${group.items[0]?.href || "top"}`;

          // Collapsed mode: flat icons with separators between groups
          if (collapsed) {
            return (
              <div key={key}>
                {groupIndex > 0 && (
                  <div className="border-t border-sidebar-border mx-1 my-1.5" />
                )}
                <div className="space-y-0.5">
                  {group.items.map(renderNavItem)}
                </div>
              </div>
            );
          }

          // Expanded mode — ungrouped items render flat
          if (!group.label) {
            return (
              <div key={key} className="space-y-0.5">
                {group.items.map(renderNavItem)}
              </div>
            );
          }

          // Expanded mode — grouped items with collapsible sections
          const isOpen = !collapsedSections[group.label];
          return (
            <Collapsible
              key={key}
              open={isOpen}
              onOpenChange={() => toggleSection(group.label)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 group/trigger hover:opacity-80 transition-opacity">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-muted-foreground transition-transform duration-200",
                    !isOpen && "-rotate-90"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5">
                {group.items.map(renderNavItem)}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Admin link */}
        {roleData?.isAdmin && (
          <div>
            {collapsed && (
              <div className="border-t border-sidebar-border mx-1 my-1.5" />
            )}
            <div className="space-y-0.5">
              {renderNavItem({
                label: "Admin",
                href: "/admin",
                icon: Shield,
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Collapse toggle */}
      <div
        className={cn(
          "border-t shrink-0",
          collapsed ? "p-1.5" : "p-2"
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed(false)}
                className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <PanelLeftOpen className="h-4 w-4 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Expand sidebar
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => setCollapsed(true)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <PanelLeftClose className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left whitespace-nowrap overflow-hidden">
              Collapse
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
