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
  FileText,
  BookOpen,
  Package,
  Target,
  Mic,
  Brain,
  Settings,
} from "lucide-react";

const mobileNavItems = [
  { label: "Command Center", href: "/", icon: LayoutDashboard },
  { label: "Optimizer", href: "/optimizer", icon: Sparkles },
  { label: "Angles", href: "/content/angles", icon: FileText },
  { label: "Outline", href: "/content/outline", icon: BookOpen },
  { label: "Write", href: "/content/write", icon: PenTool },
  { label: "Authority Packets", href: "/authority/packets", icon: Package },
  { label: "Gap Analysis", href: "/authority/gaps", icon: Target },
  { label: "Voice Builder", href: "/voice", icon: Mic },
  { label: "Brain Builder", href: "/brain", icon: Brain },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
        <nav className="space-y-1 p-3">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === item.href &&
                  "bg-accent text-accent-foreground font-medium"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
