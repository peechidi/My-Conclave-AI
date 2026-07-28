import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { knowledgePacks, accentClasses } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Conclave AI" },
      { name: "description", content: "Manage your profile, council preferences, and knowledge packs." },
      { property: "og:title", content: "Settings · Conclave AI" },
      { property: "og:description", content: "Manage your profile, council preferences, and knowledge packs." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="min-h-screen bg-surface-muted/40">
      <TopNav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure your profile, council preferences, and knowledge packs.
        </p>

        <section className="mt-8 space-y-4">
          <SectionCard title="Profile" description="This shows up in shared workspaces.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" defaultValue="Sarah Reeve, PharmD" />
              <Field label="Role" defaultValue="Director of Clinical Content" />
              <Field label="Email" defaultValue="sarah@meridianhealth.org" />
              <Field label="Institution" defaultValue="Meridian Health Systems" />
            </div>
          </SectionCard>

          <SectionCard
            title="Council preferences"
            description="Set defaults for every new workspace."
          >
            {[
              { l: "Auto-convene council on upload", d: "Start research review as soon as a source is parsed." },
              { l: "Require ethics sign-off before export", d: "Blocks publishing until trust score ≥ 80." },
              { l: "Include Cultural & Accessibility Advisor", d: "Optional fifth expert on every session." },
            ].map((s, i) => (
              <div
                key={s.l}
                className={cn("flex items-center justify-between py-4", i !== 0 && "border-t border-border/60")}
              >
                <div>
                  <div className="text-sm font-medium">{s.l}</div>
                  <div className="text-xs text-muted-foreground">{s.d}</div>
                </div>
                <Switch defaultChecked={i !== 2} />
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="Knowledge packs"
            description="Curated source libraries the council draws from."
          >
            <div className="space-y-2">
              {knowledgePacks.map((k) => {
                const a = accentClasses[k.accent];
                const active = k.status === "active";
                return (
                  <div
                    key={k.id}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-4",
                      active ? "border-emerald/40 bg-emerald-soft/40" : "border-border/70 bg-surface",
                    )}
                  >
                    <div className={cn("grid h-10 w-10 place-items-center rounded-lg", a.bg, a.text)}>
                      <span className="text-sm font-semibold">{k.name[0]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{k.name}</div>
                        {active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-medium text-emerald">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{k.description}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{k.sources}</div>
                    <Button variant={active ? "outline" : "ghost"} size="sm" disabled={!active}>
                      {active ? "Manage" : "Notify me"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Danger zone" description="Irreversible account actions.">
            <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div>
                <div className="text-sm font-medium">Delete workspace history</div>
                <div className="text-xs text-muted-foreground">
                  Removes every project, draft, and trust report from your account.
                </div>
              </div>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10">
                Delete
              </Button>
            </div>
          </SectionCard>
        </section>
      </main>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface p-6">
      <div className="mb-5">
        <h2 className="font-display text-xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input defaultValue={defaultValue} className="mt-1.5" />
    </label>
  );
}
