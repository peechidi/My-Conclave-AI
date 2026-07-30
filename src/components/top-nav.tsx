import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ArrowUpRight, LogOut } from "lucide-react";

export function TopNav({ variant = "app" }: { variant?: "marketing" | "app" }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate({ to: "/login" });
  }

  if (variant === "marketing") {
    return (
      <header className="sticky top-0 z-40">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl glass px-4 py-2.5">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {[
              ["Council", "#council"],
              ["Workflow", "#workflow"],
              ["Trust", "#trust"],
              ["Pricing", "#pricing"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="gap-1.5">
              <Link to="/dashboard">
                Open app <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  const tabs = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/workspace/wsp_glp1_pharmacists", label: "Workspaces" },
    { to: "/settings", label: "Settings" },
  ];

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "··";

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-4 px-6">
        <Logo size="sm" />
        <div className="mx-3 hidden h-6 w-px bg-border md:block" />
        <nav className="hidden items-center gap-1 md:flex">
          {tabs.map((t) => {
            const active =
              t.to === "/dashboard"
                ? path === "/dashboard"
                : path.startsWith(t.to.split("/").slice(0, 2).join("/"));
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs text-muted-foreground md:flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
            </span>
            Council online · 5 experts
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo to-emerald text-xs font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {initials}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user?.email && (
                <>
                  <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
