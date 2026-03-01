"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthor } from "@/hooks/use-author";
import { useAuthors, useSetPrimaryAuthor } from "@/lib/api/hooks/use-authors";
import { useWorkflowPreferences } from "@/hooks/use-workflow-preferences";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Moon, Sun, LogOut, User, ChevronDown, Star, Mic } from "lucide-react";
import { MobileNav } from "./mobile-nav";

function formatAuthorLabel(name: string, archetype?: string | null) {
  if (!archetype || archetype === "general") return name;
  return `${name} · ${archetype}`;
}

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { author, hasNoAuthors } = useAuthor();
  const { data: authorsData } = useAuthors();
  const setPrimary = useSetPrimaryAuthor();
  const { setLastAuthorId } = useWorkflowPreferences();
  const router = useRouter();
  const supabase = createClient();
  const authors = authorsData?.authors ?? [];
  const hasMultipleAuthors = authors.length > 1;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleSwitchAuthor(authorId: string) {
    if (authorId !== author?.id) {
      setLastAuthorId(authorId);
      setPrimary.mutate(authorId);
    }
  }

  const initials = author?.name
    ? author.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <MobileNav />
        {hasNoAuthors ? (
          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
          >
            <Mic className="h-3.5 w-3.5" />
            Set up your first voice
          </Link>
        ) : hasMultipleAuthors ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hidden sm:flex">
                {author ? formatAuthorLabel(author.name, author.archetype) : "Loading..."}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {authors.map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  onClick={() => handleSwitchAuthor(a.id)}
                  className="gap-2"
                >
                  {a.is_primary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                  {!a.is_primary && <span className="w-3" />}
                  <span className={a.id === author?.id ? "font-medium" : ""}>
                    {formatAuthorLabel(a.name, a.archetype)}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/voice" className="gap-2">
                  <Mic className="h-3 w-3" />
                  Voice DNA
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/voice"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            {author ? formatAuthorLabel(author.name, author.archetype) : "Loading..."}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              {author?.name ?? "Loading..."}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
