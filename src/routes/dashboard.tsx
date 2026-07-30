import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/auth-guards";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sampleProjects, templates, knowledgePacks, accentClasses } from "@/lib/mock-data";
import {
  Plus,
  Search,
  Upload,
  Clock,
  Library,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Conclave AI" },
      { name: "description", content: "Your workspaces, templates, and knowledge packs." },
      { property: "og:title", content: "Dashboard · Conclave AI" },
      { property: "og:description", content: "Your workspaces, templates, and knowledge packs." },
    ],
  }),
  component: Dashboard,
});

const statusStyle: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  "in-council": "bg-indigo/10 text-indigo",
  review: "bg-amber/15 text-amber",
  published: "bg-emerald/10 text-emerald",
};
const statusLabel: Record<string, string> = {
  draft: "Draft",
  "in-council": "In council",
  review: "In review",
  published: "Published",
};

function Dashboard() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-surface-muted/40">
        <TopNav />

        <main className="mx-auto max-w-7xl px-6 py-10">
          {/* Hero header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Monday · 27 July
              </div>
              <h1 className="font-display mt-2 text-4xl">
                Good afternoon, <span className="text-gradient italic">Sarah</span>.
              </h1>
              <p className="mt-1.5 text-muted-foreground">
                Your council has three sessions in flight and one draft awaiting your review.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search workspaces…" className="h-10 w-72 rounded-xl pl-9" />
              </div>
              <Button className="h-10 gap-1.5 rounded-xl">
                <Plus className="h-4 w-4" /> New project
              </Button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {[
              { icon: Plus, title: "New project", body: "Blank workspace", accent: "indigo" },
              { icon: Upload, title: "Upload research", body: "PDF, DOCX, URL", accent: "emerald" },
              { icon: Clock, title: "Recent sessions", body: "3 in progress", accent: "sky" },
              { icon: Library, title: "Templates", body: "12 curated flows", accent: "amber" },
            ].map((q) => {
              const a = accentClasses[q.accent as keyof typeof accentClasses];
              const Icon = q.icon;
              return (
                <button
                  key={q.title}
                  className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-surface p-4 text-left transition hover:shadow-elegant"
                >
                  <div className={cn("grid h-11 w-11 place-items-center rounded-xl", a.bg, a.text)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{q.title}</div>
                    <div className="text-xs text-muted-foreground">{q.body}</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </button>
              );
            })}
          </div>

          {/* Stats strip */}
          <div className="mt-8 grid gap-3 rounded-2xl border border-border/70 bg-surface p-2 md:grid-cols-4">
            {[
              { l: "Active workspaces", v: "6", trend: "+2 this week" },
              { l: "Claims verified", v: "1,284", trend: "88% supported" },
              { l: "Council hours saved", v: "34.5h", trend: "vs. last month" },
              { l: "Avg. trust score", v: "84", trend: "+6 pts" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
                <div className="font-display mt-2 text-3xl">{s.v}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald">
                  <TrendingUp className="h-3 w-3" /> {s.trend}
                </div>
              </div>
            ))}
          </div>

          {/* Projects grid */}
          <div className="mt-12 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Recent projects</h2>
            <a href="#" className="text-sm text-indigo hover:underline">
              View all
            </a>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sampleProjects.map((p) => (
              <Link
                key={p.id}
                to="/workspace/$id"
                params={{ id: p.id }}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface transition hover:shadow-elegant"
              >
                <div className={cn("h-28 bg-gradient-to-br", p.cover)}>
                  <div className="flex h-full items-end justify-between p-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusStyle[p.status],
                      )}
                    >
                      {statusLabel[p.status]}
                    </span>
                    <div className="glass rounded-full px-2 py-0.5 text-[10px] font-medium">
                      Trust {p.trust}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-display text-lg leading-snug">{p.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.audience} · {p.outputType}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Updated {p.updated}</span>
                    <span className="tabular-nums">{p.progress}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo to-emerald transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom grid: templates + knowledge packs */}
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-border/70 bg-surface p-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="font-display text-xl">Templates</h3>
                  <p className="text-sm text-muted-foreground">Start from a proven flow.</p>
                </div>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-5 grid gap-2 md:grid-cols-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 p-3 text-left transition hover:bg-accent"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-muted text-lg">
                      {t.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.audience}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-surface p-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="font-display text-xl">Knowledge packs</h3>
                  <p className="text-sm text-muted-foreground">Curated source libraries.</p>
                </div>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-5 space-y-2">
                {knowledgePacks.map((k) => {
                  const a = accentClasses[k.accent];
                  return (
                    <div
                      key={k.id}
                      className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
                    >
                      <div className={cn("h-2.5 w-2.5 rounded-full", a.dot)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{k.name}</div>
                          {k.status === "coming-soon" && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              Coming soon
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {k.description}
                        </div>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {k.status === "active" ? "Live" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
