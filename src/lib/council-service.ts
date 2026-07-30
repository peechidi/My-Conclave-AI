import { supabase } from "@/lib/supabase";
import { handleSupabaseError, requireUserId } from "@/lib/supabase-helpers";
import { getProcessedDocument } from "@/lib/document-processing-service";
import type { AgentKey, CouncilStatus, Database } from "@/lib/database.types";

export type CouncilSession = Database["public"]["Tables"]["council_sessions"]["Row"];
export type AgentResponse = Database["public"]["Tables"]["council_agent_responses"]["Row"];
export type CouncilSummary = Database["public"]["Tables"]["council_summaries"]["Row"];

export type CouncilData = {
  session: CouncilSession | null;
  responses: AgentResponse[];
  summary: CouncilSummary | null;
};

export type AgentReview = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  confidenceScore: number;
};

export const COUNCIL_AGENTS: { key: AgentKey; name: string; focus: string[] }[] = [
  {
    key: "medical_reviewer",
    name: "Medical Reviewer",
    focus: ["Clinical accuracy", "Scientific correctness", "Evidence quality"],
  },
  {
    key: "content_strategist",
    name: "Content Strategist",
    focus: ["Structure", "Flow", "Headings", "Narrative"],
  },
  {
    key: "audience_specialist",
    name: "Audience Specialist",
    focus: ["Readability", "Target audience", "Tone", "Accessibility"],
  },
  {
    key: "public_health_advisor",
    name: "Public Health Advisor",
    focus: ["Population impact", "Health communication", "Behavior change", "Equity"],
  },
  {
    key: "creative_storytelling_editor",
    name: "Creative Storytelling Editor",
    focus: ["Examples", "Hooks", "Engagement", "Storytelling"],
  },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const AGENT_TEMPLATES: Record<
  AgentKey,
  {
    summary: (words: number) => string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }
> = {
  medical_reviewer: {
    summary: (words) =>
      `Reviewed ${words} words for clinical accuracy and evidence quality. Core claims are broadly consistent with current standards of care.`,
    strengths: [
      "Claims are traceable to credible sources",
      "Terminology is used correctly",
      "No unsupported efficacy claims found",
    ],
    weaknesses: [
      "Some statistics lack a cited source",
      "A few claims could be over-generalized without qualification",
    ],
    recommendations: [
      "Add citations for every quantitative claim",
      "Flag any off-label or investigational uses explicitly",
    ],
  },
  content_strategist: {
    summary: (words) =>
      `Assessed structure and flow across ${words} words. The piece has a clear throughline with room to tighten transitions.`,
    strengths: ["Logical section ordering", "Headings map cleanly to the narrative arc"],
    weaknesses: [
      "Some paragraphs run long for the medium",
      "The opening could hook the reader faster",
    ],
    recommendations: [
      "Break up dense paragraphs with subheadings",
      "Lead with the strongest claim, not the background",
    ],
  },
  audience_specialist: {
    summary: (words) =>
      `Evaluated readability and tone for the target audience across ${words} words.`,
    strengths: ["Tone is consistent and approachable", "Jargon is mostly explained on first use"],
    weaknesses: [
      "A few sentences exceed a comfortable reading level",
      "Accessibility of complex terms could improve",
    ],
    recommendations: [
      "Simplify sentences longer than 25 words",
      "Add a glossary for specialist terminology",
    ],
  },
  public_health_advisor: {
    summary: (words) =>
      `Considered population-level impact and equity across ${words} words of content.`,
    strengths: ["Message is applicable across care settings", "No stigmatizing language detected"],
    weaknesses: [
      "Limited acknowledgment of access/equity barriers",
      "Behavior-change guidance could be more actionable",
    ],
    recommendations: [
      "Add a note on equitable access to the intervention discussed",
      "Include one concrete behavior-change step for readers",
    ],
  },
  creative_storytelling_editor: {
    summary: (words) => `Reviewed engagement and narrative hooks across ${words} words.`,
    strengths: ["Concrete examples ground abstract points", "Voice is distinct and consistent"],
    weaknesses: [
      "Could use one more vivid example mid-piece",
      "The closing doesn't fully land the takeaway",
    ],
    recommendations: [
      "Add a short patient/reader story to open",
      "End with a single memorable takeaway line",
    ],
  },
};

function generatePlaceholderReview(agentKey: AgentKey, documentText: string): AgentReview {
  const template = AGENT_TEMPLATES[agentKey];
  const trimmed = documentText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const hash = hashString(`${agentKey}:${documentText}`);

  return {
    summary: template.summary(wordCount),
    strengths: template.strengths,
    weaknesses: template.weaknesses,
    recommendations: template.recommendations,
    confidenceScore: 72 + (hash % 25), // 72-96
  };
}

// The only function to change when a real LLM is wired up — everything else
// in the app depends only on this signature and return shape.
export async function runAgent(agentKey: AgentKey, documentText: string): Promise<AgentReview> {
  // Simulated "thinking" time so the sequential reveal in the UI is visible.
  await new Promise((resolve) => setTimeout(resolve, 900 + (hashString(agentKey) % 400)));
  return generatePlaceholderReview(agentKey, documentText);
}

type SaveResponseInput = Partial<{
  status: CouncilStatus;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  confidenceScore: number;
  error: string;
}>;

export async function saveResponse(
  sessionId: string,
  projectId: string,
  agentKey: AgentKey,
  update: SaveResponseInput,
): Promise<AgentResponse> {
  const userId = await requireUserId();
  const payload = {
    session_id: sessionId,
    project_id: projectId,
    user_id: userId,
    agent_key: agentKey,
    ...(update.status !== undefined && { status: update.status }),
    ...(update.summary !== undefined && { summary: update.summary }),
    ...(update.strengths !== undefined && { strengths: update.strengths }),
    ...(update.weaknesses !== undefined && { weaknesses: update.weaknesses }),
    ...(update.recommendations !== undefined && { recommendations: update.recommendations }),
    ...(update.confidenceScore !== undefined && { confidence_score: update.confidenceScore }),
    ...(update.error !== undefined && { error: update.error }),
  };
  console.log("[council] agent response upsert:", payload);

  const { data, error } = await supabase
    .from("council_agent_responses")
    .upsert(payload, { onConflict: "session_id,agent_key" })
    .select()
    .single();

  if (error)
    handleSupabaseError("agent response upsert", error, "Couldn't save the agent's review.");
  return data;
}

export async function generateSummary(
  sessionId: string,
  projectId: string,
): Promise<CouncilSummary> {
  const userId = await requireUserId();

  const { data: responses, error: fetchError } = await supabase
    .from("council_agent_responses")
    .select("*")
    .eq("session_id", sessionId);
  if (fetchError)
    handleSupabaseError("fetch responses", fetchError, "Couldn't load agent reviews.");

  const completed = responses.filter(
    (r) => r.status === "completed" && r.confidence_score !== null,
  );
  const overallConfidence = completed.length
    ? Math.round(
        completed.reduce((sum, r) => sum + (r.confidence_score ?? 0), 0) / completed.length,
      )
    : null;

  const mean = overallConfidence ?? 0;
  const conflicts = completed
    .filter((r) => Math.abs((r.confidence_score ?? 0) - mean) > 10)
    .map((r) => {
      const agent = COUNCIL_AGENTS.find((a) => a.key === r.agent_key);
      const direction = (r.confidence_score ?? 0) > mean ? "higher" : "lower";
      return `${agent?.name ?? r.agent_key} rated confidence notably ${direction} than the group.`;
    });

  const recommendedImprovements = Array.from(
    new Set(completed.map((r) => r.recommendations[0]).filter((r): r is string => Boolean(r))),
  );

  const consensus = completed.length
    ? `${completed.length} of ${COUNCIL_AGENTS.length} agents completed their review with an average confidence of ${overallConfidence}/100. The council broadly agrees the content is well-sourced and structured, with targeted improvements identified below.`
    : "No agent reviews completed yet.";

  const payload = {
    session_id: sessionId,
    project_id: projectId,
    user_id: userId,
    consensus,
    conflicts,
    recommended_improvements: recommendedImprovements,
    overall_confidence: overallConfidence,
  };
  console.log("[council] summary upsert:", payload);

  const { data, error } = await supabase
    .from("council_summaries")
    .upsert(payload, { onConflict: "session_id" })
    .select()
    .single();

  if (error) handleSupabaseError("summary upsert", error, "Couldn't save the council summary.");
  return data;
}

export async function startCouncil(
  documentId: string,
  onAgentComplete?: (agentKey: AgentKey, review: AgentReview) => void,
): Promise<void> {
  const userId = await requireUserId();

  const content = await getProcessedDocument(documentId);
  if (!content || content.processing_status !== "ready" || !content.raw_text) {
    throw new Error("This document isn't ready for AI yet.");
  }

  const { data: session, error: sessionError } = await supabase
    .from("council_sessions")
    .insert({
      document_id: documentId,
      project_id: content.project_id,
      user_id: userId,
      status: "running",
    })
    .select()
    .single();
  if (sessionError)
    handleSupabaseError("create session", sessionError, "Couldn't start the council.");

  try {
    for (const agent of COUNCIL_AGENTS) {
      await saveResponse(session.id, content.project_id, agent.key, { status: "running" });
      try {
        const review = await runAgent(agent.key, content.raw_text);
        await saveResponse(session.id, content.project_id, agent.key, {
          status: "completed",
          summary: review.summary,
          strengths: review.strengths,
          weaknesses: review.weaknesses,
          recommendations: review.recommendations,
          confidenceScore: review.confidenceScore,
        });
        onAgentComplete?.(agent.key, review);
      } catch (agentErr) {
        const message = agentErr instanceof Error ? agentErr.message : "Agent review failed.";
        await saveResponse(session.id, content.project_id, agent.key, {
          status: "failed",
          error: message,
        });
      }
    }

    await generateSummary(session.id, content.project_id);
    await supabase.from("council_sessions").update({ status: "completed" }).eq("id", session.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Council session failed.";
    console.error("[council] session failed:", { sessionId: session.id, error: message });
    await supabase
      .from("council_sessions")
      .update({ status: "failed", error: message })
      .eq("id", session.id);
  }
}

export async function getCouncil(documentId: string): Promise<CouncilData> {
  const userId = await requireUserId();

  const { data: session, error: sessionError } = await supabase
    .from("council_sessions")
    .select("*")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sessionError) {
    handleSupabaseError("get session", sessionError, "Couldn't load the council session.");
  }
  if (!session) return { session: null, responses: [], summary: null };

  const { data: responses, error: responsesError } = await supabase
    .from("council_agent_responses")
    .select("*")
    .eq("session_id", session.id);
  if (responsesError) {
    handleSupabaseError("get responses", responsesError, "Couldn't load agent reviews.");
  }

  const { data: summary, error: summaryError } = await supabase
    .from("council_summaries")
    .select("*")
    .eq("session_id", session.id)
    .maybeSingle();
  if (summaryError) {
    handleSupabaseError("get summary", summaryError, "Couldn't load the council summary.");
  }

  return { session, responses, summary };
}
