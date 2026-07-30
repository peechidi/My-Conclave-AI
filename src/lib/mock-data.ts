import { Microscope, Palette, Users, Scale, Globe, type LucideIcon } from "lucide-react";

export type CouncilRole = "research" | "creative" | "audience" | "ethics" | "cultural";

export type CouncilMember = {
  id: CouncilRole;
  name: string;
  title: string;
  icon: LucideIcon;
  accent: "indigo" | "emerald" | "sky" | "amber" | "rose";
  bio: string;
  capabilities: string[];
};

export const councilMembers: CouncilMember[] = [
  {
    id: "research",
    name: "Dr. Ada Chen",
    title: "Research Analyst",
    icon: Microscope,
    accent: "indigo",
    bio: "Extracts evidence, cross-references sources, and surfaces study limitations.",
    capabilities: ["Evidence extraction", "Citation mapping", "Limitation flags"],
  },
  {
    id: "creative",
    name: "Milo Grant",
    title: "Creative Strategist",
    icon: Palette,
    accent: "emerald",
    bio: "Shapes narrative, tightens hooks, and finds the story worth telling.",
    capabilities: ["Narrative arcs", "Hook drafting", "Voice tuning"],
  },
  {
    id: "audience",
    name: "Priya Sundar",
    title: "Audience Advocate",
    icon: Users,
    accent: "sky",
    bio: "Adapts language for the reader — from clinicians to caregivers.",
    capabilities: ["Readability scoring", "Persona fit", "Simplification"],
  },
  {
    id: "ethics",
    name: "Judge Okafor",
    title: "Ethics & Trust Advisor",
    icon: Scale,
    accent: "amber",
    bio: "Detects unsupported claims and recommends responsible wording.",
    capabilities: ["Claim verification", "Risk assessment", "Bias review"],
  },
  {
    id: "cultural",
    name: "Sena Alvarez",
    title: "Cultural & Accessibility Advisor",
    icon: Globe,
    accent: "rose",
    bio: "Ensures inclusive, accessible, culturally aware communication.",
    capabilities: ["Inclusive language", "A11y checks", "Localization hints"],
  },
];

export type TimelineStage = {
  id: string;
  title: string;
  member?: CouncilRole;
  status: "done" | "active" | "pending";
  time: string;
  note: string;
};

export const timelineStages: TimelineStage[] = [
  {
    id: "t1",
    title: "Document uploaded",
    status: "done",
    time: "0:00",
    note: "NEJM_2025_GLP1_meta_analysis.pdf — 34 pages, 4 tables, 62 references.",
  },
  {
    id: "t2",
    title: "Evidence extracted",
    member: "research",
    status: "done",
    time: "0:41",
    note: "142 claims identified. 118 supported by source. 24 need verification.",
  },
  {
    id: "t3",
    title: "Research review complete",
    member: "research",
    status: "done",
    time: "1:14",
    note: "Flagged 3 limitations in cohort size. Suggested 2 companion citations.",
  },
  {
    id: "t4",
    title: "Creative suggestions",
    member: "creative",
    status: "active",
    time: "1:52",
    note: "Drafting three opening hooks calibrated for busy pharmacists.",
  },
  {
    id: "t5",
    title: "Audience review",
    member: "audience",
    status: "pending",
    time: "—",
    note: "Waiting on creative draft to run readability at PhD → practitioner level.",
  },
  {
    id: "t6",
    title: "Trust review",
    member: "ethics",
    status: "pending",
    time: "—",
    note: "Will verify every claim against extracted evidence.",
  },
  {
    id: "t7",
    title: "Final draft ready",
    status: "pending",
    time: "—",
    note: "Council convenes for a synthesis pass before hand-off.",
  },
];

export type TrustClaim = {
  id: string;
  claim: string;
  status: "supported" | "needs-evidence" | "risky";
  source?: string;
  suggestion?: string;
};

export const trustClaims: TrustClaim[] = [
  {
    id: "c1",
    claim: "Semaglutide reduced major adverse cardiovascular events by 20% in the SELECT trial.",
    status: "supported",
    source: "NEJM, 2023 — Lincoff et al., SELECT trial (n=17,604).",
  },
  {
    id: "c2",
    claim: "GLP-1 agonists are safe for all patients with a history of pancreatitis.",
    status: "risky",
    suggestion:
      "Rephrase: 'Use with caution in patients with a prior history of pancreatitis; individualized risk assessment is recommended.'",
  },
  {
    id: "c3",
    claim: "Most patients experience nausea in the first month of dose escalation.",
    status: "supported",
    source: "STEP-1 trial, prescribing information.",
  },
  {
    id: "c4",
    claim: "Compounded semaglutide is bioequivalent to branded formulations.",
    status: "needs-evidence",
    suggestion: "No published bioequivalence data. Suggest citing FDA compounding advisory (2024).",
  },
  {
    id: "c5",
    claim: "Weight regain is common after discontinuation.",
    status: "supported",
    source: "STEP-4 extension study.",
  },
  {
    id: "c6",
    claim: "GLP-1 agonists cure type 2 diabetes.",
    status: "risky",
    suggestion:
      "Replace 'cure' with 'improve glycemic control' — cure is not supported by current evidence.",
  },
];

export const knowledgePacks = [
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Peer-reviewed medicine, public health, and clinical practice.",
    sources: "12,400 sources · updated weekly",
    status: "active" as const,
    accent: "emerald" as const,
  },
  {
    id: "law",
    name: "Law",
    description: "Case law, statutes, and regulatory frameworks.",
    sources: "Coming Q2 2026",
    status: "coming-soon" as const,
    accent: "indigo" as const,
  },
  {
    id: "education",
    name: "Education",
    description: "Pedagogy, curriculum design, and learning science.",
    sources: "Coming Q2 2026",
    status: "coming-soon" as const,
    accent: "sky" as const,
  },
  {
    id: "research",
    name: "Scientific Research",
    description: "Open-access preprints and peer-reviewed literature.",
    sources: "Coming Q3 2026",
    status: "coming-soon" as const,
    accent: "amber" as const,
  },
  {
    id: "policy",
    name: "Public Policy",
    description: "Government reports, white papers, and think-tank analyses.",
    sources: "Coming Q3 2026",
    status: "coming-soon" as const,
    accent: "rose" as const,
  },
];

export const templates = [
  { id: "t1", name: "Patient explainer", audience: "Patients", icon: "💊" },
  { id: "t2", name: "Clinician brief", audience: "Physicians", icon: "🩺" },
  { id: "t3", name: "Social carousel", audience: "General public", icon: "📱" },
  { id: "t4", name: "CME micro-course", audience: "Continuing ed", icon: "🎓" },
  { id: "t5", name: "Newsroom brief", audience: "Journalists", icon: "📰" },
  { id: "t6", name: "Policy memo", audience: "Policymakers", icon: "🏛" },
];

export const accentClasses: Record<
  CouncilMember["accent"],
  { bg: string; text: string; ring: string; dot: string; soft: string }
> = {
  indigo: {
    bg: "bg-indigo/10",
    text: "text-indigo",
    ring: "ring-indigo/30",
    dot: "bg-indigo",
    soft: "bg-indigo-soft",
  },
  emerald: {
    bg: "bg-emerald/10",
    text: "text-emerald",
    ring: "ring-emerald/30",
    dot: "bg-emerald",
    soft: "bg-emerald-soft",
  },
  sky: {
    bg: "bg-sky/10",
    text: "text-sky",
    ring: "ring-sky/30",
    dot: "bg-sky",
    soft: "bg-sky-soft",
  },
  amber: {
    bg: "bg-amber/15",
    text: "text-amber",
    ring: "ring-amber/30",
    dot: "bg-amber",
    soft: "bg-amber-soft",
  },
  rose: {
    bg: "bg-rose/10",
    text: "text-rose",
    ring: "ring-rose/30",
    dot: "bg-rose",
    soft: "bg-rose-soft",
  },
};

export const generatedContent = {
  title: "GLP-1 Agonists: A Pharmacist's Field Guide",
  subtitle:
    "What community pharmacists need to know about the 2025 evidence base — in five minutes.",
  body: [
    {
      heading: "The one-minute summary",
      text: "GLP-1 receptor agonists have moved from niche diabetes therapy to a category-defining class for cardiometabolic risk. The 2025 evidence base gives community pharmacists three clear counseling moments: initiation, dose escalation, and discontinuation. Each has a distinct safety and expectations conversation.",
    },
    {
      heading: "What changed in the last twelve months",
      text: "The SELECT trial extended semaglutide's indication into cardiovascular risk reduction for patients without diabetes. Real-world data on compounded formulations has raised regulatory concern, and FDA advisories now warn against sourcing outside approved supply chains.",
    },
    {
      heading: "Three counseling scripts you can use tomorrow",
      text: "Initiation: normalize gastrointestinal side effects and set a 4-week check-in. Escalation: reinforce slow titration and hydration. Discontinuation: prepare patients for weight regain and glycemic rebound, and offer a bridging conversation with the prescriber.",
    },
  ],
};
