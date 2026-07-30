import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth-guards";
import { TopNav } from "@/components/top-nav";
import {
  councilMembers,
  accentClasses,
  timelineStages,
  trustClaims,
  knowledgePacks,
  generatedContent,
  templates,
} from "@/lib/mock-data";
import { useProject, useProjects } from "@/hooks/use-projects";
import { useDocuments, useDeleteDocument, useUploadDocument } from "@/hooks/use-documents";
import { getDocumentUrl, validateDocumentFile, type DocumentRecord } from "@/lib/document-service";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  FileText,
  Upload,
  Sparkles,
  Shield,
  Download,
  ChevronDown,
  ChevronRight,
  Folder,
  Library,
  History,
  Settings,
  Home,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Link as LinkIcon,
  Loader2,
  Copy,
  Share2,
  FileDown,
  Sliders,
  ArrowRight,
  MessageSquare,
  Trash2,
} from "lucide-react";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const Route = createFileRoute("/workspace/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Workspace · Conclave AI" },
      { name: "description", content: `Workspace ${params.id} in Conclave AI.` },
      { property: "og:title", content: "Workspace · Conclave AI" },
      { property: "og:description", content: "Collaborate with your AI council in real time." },
    ],
  }),
  component: Workspace,
});

type Step = "upload" | "council" | "content" | "trust" | "export";

const steps: { id: Step; label: string; icon: typeof Upload }[] = [
  { id: "upload", label: "Source", icon: Upload },
  { id: "council", label: "Council", icon: Sparkles },
  { id: "content", label: "Draft", icon: FileText },
  { id: "trust", label: "Trust", icon: Shield },
  { id: "export", label: "Export", icon: Download },
];

function Workspace() {
  const { id } = useParams({ from: "/workspace/$id" });
  const { data: project, isLoading } = useProject(id);
  const [step, setStep] = useState<Step>("council");

  if (isLoading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen items-center justify-center bg-surface-muted/40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </RequireAuth>
    );
  }

  if (!project) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface-muted/40 px-4 text-center">
          <h1 className="font-display text-2xl">Project not found</h1>
          <p className="text-sm text-muted-foreground">
            It may have been deleted, or belongs to another account.
          </p>
          <Link to="/dashboard" className="text-sm text-indigo hover:underline">
            Back to dashboard
          </Link>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-surface-muted/40">
        <TopNav />
        <div className="flex">
          <WorkspaceSidebar activeId={project.id} />

          <main className="min-h-[calc(100vh-3.5rem)] flex-1">
            {/* Header */}
            <div className="border-b border-border/70 bg-surface/60 backdrop-blur">
              <div className="px-8 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Link to="/dashboard" className="hover:text-foreground">
                        Dashboard
                      </Link>
                      <ChevronRight className="h-3 w-3" />
                      <span>Workspaces</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-foreground">{project.title}</span>
                    </div>
                    <h1 className="font-display mt-2 text-3xl leading-tight">{project.title}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge tone="indigo">{project.audience}</Badge>
                      <Badge tone="emerald">{project.output_type}</Badge>
                      <span>·</span>
                      <span>
                        Updated {formatDistanceToNowStrict(new Date(project.updated_at))} ago
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Share2 className="h-3.5 w-3.5" /> Share
                    </Button>
                    <Button size="sm" className="gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Convene council
                    </Button>
                  </div>
                </div>

                {/* Stepper */}
                <div className="mt-6 flex items-center gap-1 overflow-x-auto">
                  {steps.map((s, i) => {
                    const active = s.id === step;
                    const Icon = s.icon;
                    return (
                      <div key={s.id} className="flex items-center">
                        <button
                          onClick={() => setStep(s.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition",
                            active
                              ? "bg-foreground text-background shadow-sm"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold",
                              active
                                ? "bg-background/20 text-background"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {i + 1}
                          </span>
                          <Icon className="h-3.5 w-3.5" />
                          {s.label}
                        </button>
                        {i < steps.length - 1 && (
                          <ChevronRight className="mx-0.5 h-3 w-3 text-muted-foreground/50" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-8 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                {step === "upload" && <UploadStep projectId={project.id} />}
                {step === "council" && <CouncilStep />}
                {step === "content" && <ContentStep />}
                {step === "trust" && <TrustStep />}
                {step === "export" && <ExportStep />}
              </div>

              <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
                <CouncilPanel />
                <SuggestionsPanel />
              </aside>
            </div>
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}

/* ---------- Sidebar ---------- */

function WorkspaceSidebar({ activeId }: { activeId: string }) {
  const [openProjects, setOpenProjects] = useState(true);
  const { data: projects } = useProjects();
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border/70 bg-surface/60 backdrop-blur lg:block">
      <div className="flex h-full flex-col p-4">
        <nav className="space-y-0.5 text-sm">
          {[
            { icon: Home, label: "Home", to: "/dashboard" as const },
            { icon: Library, label: "Templates" },
            { icon: Folder, label: "Knowledge packs" },
            { icon: History, label: "History" },
            { icon: Settings, label: "Settings", to: "/settings" as const },
          ].map((i) => {
            const Icon = i.icon;
            const inner = (
              <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground">
                <Icon className="h-4 w-4" />
                {i.label}
              </div>
            );
            return i.to ? (
              <Link key={i.label} to={i.to}>
                {inner}
              </Link>
            ) : (
              <button key={i.label} className="block w-full text-left">
                {inner}
              </button>
            );
          })}
        </nav>

        <div className="mt-6">
          <button
            onClick={() => setOpenProjects((v) => !v)}
            className="flex w-full items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            <ChevronDown className={cn("h-3 w-3 transition", !openProjects && "-rotate-90")} />
            Projects
          </button>
          {openProjects && (
            <div className="mt-2 space-y-0.5">
              {projects?.map((p) => (
                <Link
                  key={p.id}
                  to="/workspace/$id"
                  params={{ id: p.id }}
                  className={cn(
                    "block truncate rounded-lg px-2.5 py-1.5 text-sm transition",
                    p.id === activeId
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {p.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto rounded-xl border border-border/70 bg-gradient-to-br from-indigo-soft to-emerald-soft p-4">
          <div className="text-xs font-medium">Healthcare pack · Live</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            12,400 sources · updated weekly
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/50">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-indigo to-emerald" />
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Reusable ---------- */

function Badge({
  tone,
  children,
}: {
  tone: keyof typeof accentClasses;
  children: React.ReactNode;
}) {
  const a = accentClasses[tone];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", a.bg, a.text)}>
      {children}
    </span>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/70 bg-surface", className)}>
      {children}
    </div>
  );
}

/* ---------- Steps ---------- */

function UploadStep({ projectId }: { projectId: string }) {
  const { data: documents, isLoading, isError } = useDocuments(projectId);
  const uploadDocument = useUploadDocument(projectId);
  const deleteDocument = useDeleteDocument(projectId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setValidationError(null);
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }

    uploadDocument.mutate(file, {
      onSuccess: () => {
        toast.success("Uploaded successfully", {
          description: "Status: Ready for AI · Uploaded just now",
        });
      },
      onError: (err) => {
        setValidationError(err instanceof Error ? err.message : "Couldn't upload the document.");
      },
    });
  }

  async function handleDownload(doc: DocumentRecord) {
    try {
      const url = await getDocumentUrl(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Couldn't open the document.");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteDocument.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          Step 1 · Bring the evidence
        </div>
        <h2 className="font-display text-2xl">Upload a document or paste a URL</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PDFs, DOCX, plain text, or Markdown. Our Research Analyst will parse tables, references,
          and figures.
        </p>

        {validationError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              "rounded-2xl border-2 border-dashed border-border p-8 text-center transition hover:border-indigo hover:bg-indigo-soft/40",
              isDragging && "border-indigo bg-indigo-soft/40",
            )}
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-soft text-indigo">
              <Upload className="h-5 w-5" />
            </div>
            <div className="mt-3 font-medium">Drop a file</div>
            <div className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD · up to 20MB</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadDocument.isPending}
            >
              {uploadDocument.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Browse files
            </Button>
          </div>
          <div className="rounded-2xl border border-border/70 p-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <LinkIcon className="h-4 w-4 text-emerald" /> Paste a URL
            </div>
            <input
              placeholder="https://www.nejm.org/doi/10.1056/…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo/30"
            />
            <div className="mt-3 text-xs text-muted-foreground">
              We follow paywalls only where you have institutional access.
            </div>
          </div>
        </div>

        {uploadDocument.isPending && (
          <div className="mt-4 rounded-xl border border-border/70 bg-surface-muted/60 p-3">
            <div className="mb-2 text-xs text-muted-foreground">
              Uploading {uploadDocument.variables?.name}…
            </div>
            <Progress value={100} className="animate-pulse" />
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Uploaded documents</div>
            <div className="text-xs text-muted-foreground">Sources for this workspace.</div>
          </div>
        </div>

        {isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>Couldn't load documents. Try refreshing the page.</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 divide-y divide-border">
          {isLoading &&
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="py-3">
                <Skeleton className="h-10 rounded-xl" />
              </div>
            ))}

          {!isLoading && !isError && documents?.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No documents yet — drop a file above to get started.
            </div>
          )}

          {documents?.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 py-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-soft text-rose">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{doc.filename}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(doc.file_size)} · Uploaded{" "}
                  {formatDistanceToNowStrict(new Date(doc.created_at))} ago
                </div>
              </div>
              <Badge tone="emerald">
                {doc.upload_status === "ready" ? "Ready for AI" : doc.upload_status}
              </Badge>
              <button
                onClick={() => handleDownload(doc)}
                aria-label="Download"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(doc)}
                aria-label="Delete"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.filename}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the file and its record from the workspace. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteDocument.isPending}
              className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDocument.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CouncilStep() {
  return (
    <div className="space-y-6">
      {/* Config bar */}
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              l: "Audience",
              v: "Community pharmacists",
              opts: ["Patients", "Clinicians", "Journalists"],
            },
            { l: "Tone", v: "Confident · practical", opts: ["Warm", "Formal", "Explanatory"] },
            {
              l: "Output",
              v: "Long-form article",
              opts: ["Social carousel", "CME module", "Newsroom brief"],
            },
          ].map((c) => (
            <div key={c.l}>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {c.l}
              </div>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border/70 bg-surface-muted/60 px-3 py-2">
                <Sliders className="h-3.5 w-3.5 text-indigo" />
                <div className="text-sm font-medium">{c.v}</div>
                <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.opts.map((o) => (
                  <span
                    key={o}
                    className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {o}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-8">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Collaboration timeline
            </div>
            <h2 className="font-display mt-1 text-2xl">Council session · in progress</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-indigo opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo" />
            </span>
            Live · 1m 52s elapsed
          </div>
        </div>

        <div className="relative mt-8">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-6">
            {timelineStages.map((t) => {
              const member = t.member ? councilMembers.find((m) => m.id === t.member) : undefined;
              const a = member ? accentClasses[member.accent] : accentClasses.indigo;
              const Icon = member?.icon ?? CheckCircle2;
              return (
                <div key={t.id} className="relative flex gap-4">
                  <div
                    className={cn(
                      "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-surface",
                      t.status === "done" && "bg-emerald text-white",
                      t.status === "active" && cn(a.bg, a.text, "animate-pulse-ring"),
                      t.status === "pending" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {t.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : t.status === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{t.title}</div>
                      {member && (
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px]", a.bg, a.text)}>
                          {member.title}
                        </span>
                      )}
                      <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                        {t.time}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{t.note}</div>
                    {t.status === "active" && (
                      <div className="mt-3 rounded-xl border border-border/70 bg-surface-muted/60 p-3 text-sm">
                        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" /> Draft hook · option 1 of 3
                        </div>
                        "You'll counsel three patients on GLP-1 agonists this week. Here's the
                        one-minute script that keeps you out of the weeds — and out of trouble."
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="h-7">
                            Accept
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7">
                            Refine
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7">
                            Show alternatives
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ContentStep() {
  return (
    <Card className="p-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Draft · v3 · synthesized
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            Regenerate flagged
          </Button>
          <Button size="sm" className="h-8">
            Accept draft
          </Button>
        </div>
      </div>

      <article className="prose prose-neutral max-w-none">
        <h1 className="font-display text-4xl leading-tight text-foreground">
          {generatedContent.title}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{generatedContent.subtitle}</p>

        <div className="mt-8 space-y-8">
          {generatedContent.body.map((s, i) => (
            <section key={i}>
              <h2 className="font-display text-2xl text-foreground">{s.heading}</h2>
              <p className="mt-2 text-[15px] leading-7 text-foreground/85">
                {s.text}
                {i === 1 && (
                  <>
                    {" "}
                    <mark className="rounded bg-amber/20 px-1">
                      Compounded formulations may not be bioequivalent
                    </mark>{" "}
                    — the Ethics Advisor recommends citing the FDA 2024 advisory here.
                  </>
                )}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border/70 bg-surface-muted/60 p-5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-indigo" /> Council synthesis
          </div>
          <p className="mt-2 text-muted-foreground">
            Research confirmed 6 of 6 primary claims. Ethics flagged 2 wording risks (resolved).
            Audience Advocate lifted readability from PhD to practitioner level.
          </p>
        </div>
      </article>
    </Card>
  );
}

function TrustStep() {
  const supported = trustClaims.filter((c) => c.status === "supported").length;
  const needs = trustClaims.filter((c) => c.status === "needs-evidence").length;
  const risky = trustClaims.filter((c) => c.status === "risky").length;

  return (
    <div className="space-y-6">
      {/* Score cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="col-span-2 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Trust score
              </div>
              <div className="font-display mt-2 flex items-baseline gap-2 text-6xl">
                88<span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <div className="mt-1 text-sm text-emerald">Publishable · low risk</div>
            </div>
            <TrustDial value={88} />
          </div>
        </Card>
        {[
          {
            l: "Readability",
            v: "Grade 11",
            note: "Fit for pharmacists",
            tone: "emerald" as const,
          },
          { l: "Audience fit", v: "92%", note: "Persona matched", tone: "sky" as const },
        ].map((s) => (
          <Card key={s.l} className="p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
            <div className="font-display mt-2 text-3xl">{s.v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.note}</div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", accentClasses[s.tone].dot)}
                style={{ width: "82%" }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-6">
          {[
            { icon: CheckCircle2, label: "Supported", n: supported, tone: "emerald" as const },
            { icon: AlertCircle, label: "Needs evidence", n: needs, tone: "amber" as const },
            { icon: AlertTriangle, label: "Risky wording", n: risky, tone: "rose" as const },
          ].map((s) => {
            const Icon = s.icon;
            const a = accentClasses[s.tone];
            return (
              <div key={s.label} className="flex items-center gap-2">
                <div className={cn("grid h-8 w-8 place-items-center rounded-lg", a.bg, a.text)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.n} claims</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Claims list */}
      <Card className="overflow-hidden">
        <div className="border-b border-border/70 px-6 py-4">
          <div className="text-sm font-medium">Claim-by-claim review</div>
          <div className="text-xs text-muted-foreground">
            Every publishable sentence traced to its source.
          </div>
        </div>
        <div className="divide-y divide-border">
          {trustClaims.map((c) => {
            const tone =
              c.status === "supported"
                ? "emerald"
                : c.status === "needs-evidence"
                  ? "amber"
                  : "rose";
            const Icon =
              c.status === "supported"
                ? CheckCircle2
                : c.status === "needs-evidence"
                  ? AlertCircle
                  : AlertTriangle;
            const a = accentClasses[tone as "emerald" | "amber" | "rose"];
            return (
              <div key={c.id} className="flex gap-4 p-6">
                <div
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                    a.bg,
                    a.text,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">"{c.claim}"</div>
                  {c.source && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" /> {c.source}
                    </div>
                  )}
                  {c.suggestion && (
                    <div className="mt-3 rounded-lg border border-border/70 bg-surface-muted/60 p-3 text-xs">
                      <span className="font-medium text-foreground">Recommendation · </span>
                      <span className="text-muted-foreground">{c.suggestion}</span>
                    </div>
                  )}
                </div>
                <Badge tone={tone as "emerald" | "amber" | "rose"}>
                  {c.status === "supported"
                    ? "Supported"
                    : c.status === "needs-evidence"
                      ? "Needs evidence"
                      : "Risky"}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function TrustDial({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
      <circle cx="44" cy="44" r={r} stroke="oklch(0.92 0.006 260)" strokeWidth="8" fill="none" />
      <circle
        cx="44"
        cy="44"
        r={r}
        stroke="url(#g)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        fill="none"
      />
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.45 0.18 268)" />
          <stop offset="1" stopColor="oklch(0.62 0.13 165)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ExportStep() {
  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Export center</div>
        <h2 className="font-display mt-1 text-2xl">Take it anywhere.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every export includes a trust appendix with source citations.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            {
              icon: FileDown,
              label: "PDF · Editorial",
              note: "With trust appendix",
              tone: "indigo" as const,
            },
            {
              icon: FileText,
              label: "Google Docs",
              note: "One-click handoff",
              tone: "sky" as const,
            },
            { icon: FileDown, label: "Markdown", note: "For your CMS", tone: "emerald" as const },
            {
              icon: FileDown,
              label: "DOCX",
              note: "For editorial workflow",
              tone: "amber" as const,
            },
            {
              icon: FileDown,
              label: "Social carousel",
              note: "6 slides · PNG",
              tone: "rose" as const,
            },
            {
              icon: FileDown,
              label: "Newsletter block",
              note: "HTML email",
              tone: "indigo" as const,
            },
          ].map((e) => {
            const Icon = e.icon;
            const a = accentClasses[e.tone];
            return (
              <button
                key={e.label}
                className="group flex items-start gap-3 rounded-2xl border border-border/70 p-4 text-left transition hover:shadow-elegant"
              >
                <div className={cn("grid h-10 w-10 place-items-center rounded-xl", a.bg, a.text)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{e.label}</div>
                  <div className="text-xs text-muted-foreground">{e.note}</div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-soft to-emerald-soft p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-display text-2xl">Ready to publish?</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Trust score 88 · 6 supported · 0 unresolved risks
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Save draft</Button>
            <Button className="gap-1.5 shadow-glow">
              Publish <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Right rail ---------- */

function CouncilPanel() {
  const [expanded, setExpanded] = useState<string | null>("creative");
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <div className="text-sm font-medium">Knowledge Council</div>
          <div className="text-xs text-muted-foreground">5 experts · 3 active</div>
        </div>
        <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
          Live
        </span>
      </div>
      <div className="space-y-1.5">
        {councilMembers.map((m) => {
          const Icon = m.icon;
          const a = accentClasses[m.accent];
          const isExpanded = expanded === m.id;
          const progress =
            m.id === "research"
              ? 100
              : m.id === "creative"
                ? 62
                : m.id === "audience"
                  ? 24
                  : m.id === "ethics"
                    ? 0
                    : 0;
          return (
            <div key={m.id} className="rounded-xl border border-border/60">
              <button
                onClick={() => setExpanded(isExpanded ? null : m.id)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <div className={cn("grid h-9 w-9 place-items-center rounded-lg", a.bg, a.text)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.title}</div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", a.dot)}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>
              {isExpanded && (
                <div className="border-t border-border/60 p-3 text-xs text-muted-foreground">
                  <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider">
                    Current reasoning
                  </div>
                  <p>
                    Drafting three opening hooks calibrated for community pharmacists. Testing each
                    against readability, audience persona, and evidence anchor points.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.capabilities.map((c) => (
                      <span
                        key={c}
                        className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-foreground/70"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SuggestionsPanel() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="text-sm font-medium">Pending suggestions</div>
        <span className="text-xs text-muted-foreground">4</span>
      </div>
      <div className="space-y-2">
        {[
          {
            m: "creative",
            t: "Replace headline with option 2 — stronger hook.",
            tone: "emerald" as const,
          },
          { m: "ethics", t: 'Soften "cure" → "improve control".', tone: "amber" as const },
          { m: "audience", t: "Simplify paragraph 3 to reading grade 10.", tone: "sky" as const },
          {
            m: "research",
            t: "Add citation: FDA 2024 compounding advisory.",
            tone: "indigo" as const,
          },
        ].map((s, i) => {
          const member = councilMembers.find((m) => m.id === s.m)!;
          const Icon = member.icon;
          const a = accentClasses[s.tone];
          return (
            <div key={i} className="flex gap-3 rounded-xl border border-border/60 p-3">
              <div
                className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", a.bg, a.text)}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-muted-foreground">{member.title}</div>
                <div className="mt-0.5 text-sm">{s.t}</div>
                <div className="mt-2 flex gap-1">
                  <button className="rounded-md bg-foreground px-2 py-0.5 text-[11px] text-background hover:bg-foreground/85">
                    Accept
                  </button>
                  <button className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-accent">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
