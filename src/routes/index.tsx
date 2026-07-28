import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { councilMembers, accentClasses } from "@/lib/mock-data";
import {
  ArrowRight,
  Sparkles,
  Shield,
  FileText,
  Upload,
  Users,
  CheckCircle2,
  Quote,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conclave AI — A council of AI experts for trusted content" },
      {
        name: "description",
        content:
          "Turn dense healthcare evidence into engaging, trustworthy content. Conclave AI assembles a council of specialized experts that collaborate with you.",
      },
      { property: "og:title", content: "Conclave AI — A council of AI experts for trusted content" },
      {
        property: "og:description",
        content:
          "Turn dense healthcare evidence into engaging, trustworthy content. Conclave AI assembles a council of specialized experts that collaborate with you.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <TopNav variant="marketing" />

      {/* HERO */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-radial-fade" />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-28 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3 text-indigo" />
            Now in private beta for healthcare teams
          </div>

          <h1 className="font-display mt-6 text-balance text-6xl leading-[1.02] tracking-tight md:text-7xl">
            A <span className="text-gradient italic">council</span> of AI experts
            <br />
            for content you can defend.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Conclave AI doesn't just write. It convenes a team — research, creative, audience,
            and ethics — that collaborates with you to turn trusted knowledge into content that
            earns attention <em>and</em> holds up to scrutiny.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="h-11 gap-1.5 rounded-xl px-5 shadow-glow">
              <Link to="/dashboard">
                Enter the workspace <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="h-11 rounded-xl">
              <a href="#council">See the council</a>
            </Button>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-wider text-muted-foreground/70">
            <span>Trusted by teams at</span>
            {["Mayo Clinic", "NEJM Group", "PATH", "WHO Africa", "Kaiser"].map((n) => (
              <span key={n} className="font-medium text-foreground/60">
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Preview card */}
        <div className="relative mx-auto -mt-6 max-w-5xl px-6 pb-24">
          <div className="rounded-3xl border border-border/70 bg-surface p-2 shadow-elegant">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-soft via-sky-soft to-emerald-soft p-8">
              <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                <div className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-border/60">
                  <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> NEJM_2025_GLP1_meta_analysis.pdf
                  </div>
                  <div className="font-display text-2xl leading-snug">
                    "Semaglutide reduced <mark className="rounded bg-emerald/20 px-1 text-foreground">MACE by 20%</mark> in patients without diabetes."
                  </div>
                  <div className="mt-5 space-y-2">
                    {[
                      { m: "Research Analyst", t: "Cited SELECT trial (n=17,604)." },
                      { m: "Ethics Advisor", t: 'Flagged "cure" — recommend "improve control".' },
                      { m: "Audience Advocate", t: "Readability tuned for pharmacists." },
                    ].map((x, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-muted/60 p-3 text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald" />
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">{x.m}</div>
                          <div>{x.t}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-foreground/95 p-6 text-background shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wider text-background/60">
                      Council session
                    </div>
                    <div className="rounded-full bg-emerald/20 px-2 py-0.5 text-[10px] font-medium text-emerald">
                      Live
                    </div>
                  </div>
                  <div className="space-y-3">
                    {councilMembers.slice(0, 4).map((m) => {
                      const Icon = m.icon;
                      return (
                        <div key={m.id} className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/10">
                            <Icon className="h-4 w-4 text-background/90" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium">{m.title}</div>
                            <div className="text-xs text-background/50">{m.capabilities[0]}</div>
                          </div>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-background/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo to-emerald"
                              style={{ width: `${40 + m.id.length * 9}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 rounded-xl bg-background/5 p-3 text-xs text-background/70">
                    Synthesis pass in <span className="text-background">42s</span> ·{" "}
                    <span className="text-background">142 claims</span> verified
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo">
            The workflow
          </div>
          <h2 className="font-display mt-3 text-4xl">From evidence to publishable in one session.</h2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-4">
          {[
            { n: 1, icon: Upload, title: "Upload evidence", body: "PDF, DOCX, or a link. We parse tables, references, and structure." },
            { n: 2, icon: Users, title: "Choose audience", body: "Pharmacists? Parents? Journalists? We calibrate every voice." },
            { n: 3, icon: Sparkles, title: "Council collaborates", body: "Four experts work in parallel — you review each suggestion." },
            { n: 4, icon: Shield, title: "Export with a trust report", body: "Every claim traced to its source. Ready to publish." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border/70 bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-soft text-indigo">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="font-display text-3xl text-muted-foreground/40">0{s.n}</div>
              </div>
              <div className="font-medium">{s.title}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COUNCIL */}
      <section id="council" className="relative border-y border-border/70 bg-surface-muted/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald">
              Meet the council
            </div>
            <h2 className="font-display mt-3 text-4xl">
              Five distinct minds. One shared standard of care.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Each member owns a discipline. They deliberate independently, then synthesize.
              You stay in the chair.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {councilMembers.map((m) => {
              const Icon = m.icon;
              const a = accentClasses[m.accent];
              return (
                <div
                  key={m.id}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface p-6 transition hover:shadow-elegant"
                >
                  <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${a.soft} blur-2xl transition group-hover:scale-110`} />
                  <div className="relative">
                    <div className={`inline-grid h-11 w-11 place-items-center rounded-xl ${a.bg} ${a.text}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                      <div className="font-medium">{m.title}</div>
                      {m.id === "cultural" && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          Optional
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{m.name}</div>
                    <p className="mt-3 text-sm text-muted-foreground">{m.bio}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {m.capabilities.map((c) => (
                        <span
                          key={c}
                          className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] text-foreground/70"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section id="trust" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-amber">
              Trust, engineered
            </div>
            <h2 className="font-display mt-3 text-4xl">
              Every sentence traceable. Every claim defensible.
            </h2>
            <p className="mt-4 text-muted-foreground">
              The Ethics & Trust Advisor cross-checks every claim against your source material.
              Nothing ships without a citation or a flag.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "Claim-level source mapping",
                "Readability and audience-fit scoring",
                "Risk tier for each publishable asset",
                "One-click regeneration for flagged passages",
              ].map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald" />
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-surface p-6 shadow-elegant">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Trust score
                </div>
                <div className="font-display mt-1 text-5xl">
                  88<span className="text-2xl text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald">
                Publishable
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { l: "Supported claims", v: 118, tone: "emerald" },
                { l: "Needs evidence", v: 18, tone: "amber" },
                { l: "Risky wording", v: 6, tone: "rose" },
              ].map((x) => (
                <div key={x.l} className="flex items-center justify-between rounded-xl border border-border/70 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full bg-${x.tone}`} />
                    <span className="text-sm">{x.l}</span>
                  </div>
                  <span className="font-medium tabular-nums">{x.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-indigo-soft via-surface to-emerald-soft p-10 text-center">
          <Quote className="mx-auto h-6 w-6 text-indigo" />
          <p className="font-display mt-4 text-2xl leading-snug md:text-3xl">
            "It feels less like using an AI and more like chairing a very sharp editorial board.
            The trust report alone changed how we ship."
          </p>
          <div className="mt-6 text-sm text-muted-foreground">
            Dr. Rina Osei · Director of Content, PATH Global Health
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl bg-foreground p-12 text-background">
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h3 className="font-display text-4xl leading-tight">
                Convene your council.
                <br />
                <span className="text-background/60">Ship trusted content this week.</span>
              </h3>
              <p className="mt-4 max-w-md text-background/70">
                Healthcare knowledge pack is live. Law, education, research, and public policy —
                coming soon.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button size="lg" asChild className="h-12 rounded-xl bg-background text-foreground hover:bg-background/90">
                <Link to="/dashboard">Open the workspace</Link>
              </Button>
              <Button size="lg" variant="ghost" className="h-12 rounded-xl text-background hover:bg-background/10">
                Talk to the team
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-gradient-to-br from-indigo to-emerald" />
            © 2026 Conclave AI
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
