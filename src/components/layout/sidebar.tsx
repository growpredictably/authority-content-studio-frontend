"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sparkles,
  PenTool,
  FileText,
  BookOpen,
  Package,
  Target,
  Mic,
  Brain,
  Settings,
} from "lucide-react";

const navItems = [
  {
    label: "Command Center",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Optimizer",
    href: "/optimizer",
    icon: Sparkles,
  },
  {
    label: "Content Pipeline",
    icon: PenTool,
    children: [
      { label: "Angles", href: "/content/angles", icon: FileText },
      { label: "Outline", href: "/content/outline", icon: BookOpen },
      { label: "Write", href: "/content/write", icon: PenTool },
    ],
  },
  {
    label: "Authority Packets",
    href: "/authority/packets",
    icon: Package,
  },
  {
    label: "Gap Analysis",
    href: "/authority/gaps",
    icon: Target,
  },
  {
    label: "Voice Builder",
    href: "/voice",
    icon: Mic,
  },
  {
    label: "Brain Builder",
    href: "/brain",
    icon: Brain,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-sidebar md:text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Authority Studio</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 pl-9 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      pathname === child.href &&
                        "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    )}
                  >
                    <child.icon className="h-4 w-4" />
                    {child.label}
                  </Link>
                ))}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === item.href &&
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
