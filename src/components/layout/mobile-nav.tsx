"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  Sparkles,
  PenTool,
  FolderOpen,
  UserCircle,
  LayoutTemplate,
  BarChart3,
  TrendingUp,
  Package,
  Target,
  Mic,
  Brain,
  Settings,
} from "lucide-react";

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
      { label: "My Drafts", href: "/content/drafts", icon: FolderOpen },
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
    ],
  },
  {
    label: "Foundation",
    items: [
      { label: "Voice DNA", href: "/voice", icon: Mic },
      { label: "Brain Builder", href: "/brain", icon: Brain },
    ],
  },
  {
    label: "",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function isContentActive() {
    return (
      pathname.startsWith("/content/angles") ||
      pathname.startsWith("/content/outline") ||
      pathname.startsWith("/content/write")
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold"
            onClick={() => setOpen(false)}
          >
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Authority Studio</span>
          </Link>
        </div>
        <nav className="space-y-4 p-3">
          {navGroups.map((group) => (
            <div key={group.label || "top"} className="space-y-0.5">
              {group.label && (
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const active =
                  item.href === "/content/angles"
                    ? isContentActive()
                    : isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      active &&
                        "bg-accent text-accent-foreground font-medium"
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
              })}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
