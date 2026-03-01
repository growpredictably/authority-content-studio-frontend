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

const SIDEBAR_COLLAPSE_KEY = "sidebar-collapsed-sections";

export function Sidebar() {
  const pathname = usePathname();
  const { data: roleData } = useUserRole();

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  // Load persisted collapse state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      if (stored) {
        setCollapsedSections(JSON.parse(stored));
      }
    } catch { /* ignore corrupt data */ }
    setHydrated(true);
  }, []);

  // Persist collapse state
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(collapsedSections));
    }
  }, [collapsedSections, hydrated]);

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

  // Auto-expand section containing the active page
  useEffect(() => {
    if (!hydrated) return;
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

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          active &&
            "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        )}
      >
        <item.icon className="h-4 w-4" />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-sidebar md:text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Authority Studio</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navGroups.map((group) => {
          const key = group.label || `ungrouped-${group.items[0]?.href || "top"}`;

          // Ungrouped items — render flat, no collapse
          if (!group.label) {
            return (
              <div key={key} className="space-y-0.5">
                {group.items.map(renderNavItem)}
              </div>
            );
          }

          // Grouped items — render with collapsible
          const isOpen = !collapsedSections[group.label];
          return (
            <Collapsible key={key} open={isOpen} onOpenChange={() => toggleSection(group.label)}>
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
        {roleData?.isAdmin && (
          <div className="space-y-0.5">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive("/admin") &&
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
            >
              <Shield className="h-4 w-4" />
              <span className="flex-1">Admin</span>
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
}
