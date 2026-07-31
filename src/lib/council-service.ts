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

/** Visual phase labels shown in the UI while an agent is running. */
export type AgentPhase =
  | "preparing"
  | "reading"
  | "analyzing"
  | "generating"
  | "completed"
  | "failed";

export const AGENT_PHASES: AgentPhase[] = [
  "preparing",
  "reading",
  "analyzing",
  "generating",
  "completed",
];

export const AGENT_PHASE_LABELS: Record<AgentPhase, string> = {
  preparing: "Preparing…",
  reading: "Reading document…",
  analyzing: "Analyzing…",
  generating: "Generating recommendations…",
  completed: "Completed",
  failed: "Failed",
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

// ---------------------------------------------------------------------------
// Deterministic hash helper — used to make responses vary per-document while
// remaining consistent across re-renders. Swap out `runAgent` when watsonx
// is available; everything else stays the same.
// ---------------------------------------------------------------------------

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Pick a stable item from an array based on a deterministic seed. */
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ---------------------------------------------------------------------------
// Rich per-agent response templates
// Each agent has multiple variant pools so the response naturally differs
// between documents while remaining deterministic for the same document.
// ---------------------------------------------------------------------------

const AGENT_TEMPLATES: Record<
  AgentKey,
  {
    summaries: ((words: number, docSeed: number) => string)[];
    strengthsPools: string[][];
    weaknessesPools: string[][];
    recommendationsPools: string[][];
    baseConfidence: number;
    confidenceRange: number;
  }
> = {
  medical_reviewer: {
    summaries: [
      (words, s) =>
        `Completed a full clinical accuracy pass across all ${words} words. The primary claims align with established standards of care, and the terminology is applied correctly throughout. ${pick(["Three statistical claims", "Two comparative efficacy statements", "One dosage reference"], s)} required closer scrutiny for source traceability.`,
      (words, s) =>
        `Reviewed ${words} words against current evidence-based guidelines. The document demonstrates sound clinical reasoning. ${pick(["Cohort-size caveats", "Off-label indications", "Drug-interaction disclosures"], s)} would benefit from explicit qualification to meet regulatory communication standards.`,
      (words, s) =>
        `Performed a line-by-line evidence audit of the ${words}-word document. Core therapeutic claims are well-supported. ${pick(["Several outcome statistics", "A subset of safety statements", "Two mechanism descriptions"], s)} lack a traceable primary citation, which may undermine trust with a specialist audience.`,
    ],
    strengthsPools: [
      [
        "Therapeutic claims are traceable to peer-reviewed primary sources",
        "Medical terminology is used precisely — no casual misapplication detected",
        "Adverse-event profile is accurately represented with appropriate severity framing",
        "Drug class mechanism description is clinically current and coherent",
      ],
      [
        "No unsupported efficacy claims found in the core narrative",
        "Contraindication guidance is appropriately conservative",
        "Dosage ranges align with current prescribing information",
        "Safety language avoids absolute terms that could mislead patients",
      ],
      [
        "Clinical evidence hierarchy is correctly applied — RCTs are weighted above observational data",
        "Interaction warnings are complete and current",
        "Statistical outcomes are presented with appropriate confidence intervals",
        "Regulatory-status language is accurate for the jurisdictions referenced",
      ],
    ],
    weaknessesPools: [
      [
        "Three quantitative claims lack a cited primary source",
        "One comparative efficacy statement overstates relative risk reduction without absolute figures",
      ],
      [
        "Off-label applications are not explicitly flagged as investigational",
        "A generalised safety statement may not hold for renally impaired populations",
      ],
      [
        "Population subgroup caveats are absent from the main claims",
        "Some referenced trial data is more than five years old — newer evidence exists",
      ],
    ],
    recommendationsPools: [
      [
        "Add a citation anchor (e.g., author–year in brackets) beside every quantitative claim",
        "Qualify comparative statements with absolute risk reduction alongside relative risk",
        "Insert a 'Special populations' note covering renal, hepatic, and paediatric contexts",
      ],
      [
        "Flag off-label uses with a consistent visual marker or parenthetical note",
        "Update any trial references published before 2021 to include the most recent meta-analysis",
        "Ensure all safety statements are scoped to the studied population, not the general public",
      ],
      [
        "Cross-reference the current FDA or EMA labelling to confirm no recent safety updates",
        "Replace informal percentage claims with the exact trial figures and sample sizes",
        "Add a disclosure sentence wherever the evidence base is limited to surrogate endpoints",
      ],
    ],
    baseConfidence: 76,
    confidenceRange: 18,
  },

  content_strategist: {
    summaries: [
      (words, s) =>
        `Assessed narrative architecture across ${words} words. The document has a ${pick(["clear three-act structure", "recognisable problem–solution arc", "well-demarcated introduction–body–conclusion flow"], s)}, though the transition density between major sections could be tightened to reduce reader re-orientation effort.`,
      (words, s) =>
        `Mapped the information hierarchy of this ${words}-word piece. The heading taxonomy is ${pick(["logical and reader-navigable", "mostly coherent with one ambiguous mid-section header", "consistent in style but occasionally disconnected from the paragraph content below"], s)}. The opening paragraph does not yet deliver maximum impact.`,
      (words, s) =>
        `Conducted a structural review of the ${words}-word document. The piece demonstrates ${pick(["strong thematic cohesion", "a solid evidence-to-narrative balance", "good use of sectioning for a long-form format"], s)}. Some paragraphs exceed optimal length for the implied medium, reducing scanability.`,
    ],
    strengthsPools: [
      [
        "Logical section sequencing — each part builds meaningfully on the last",
        "H2 and H3 headings map cleanly to the stated narrative arc",
        "Transitions between evidence presentation and practical guidance are smooth",
        "Document length is appropriate for the depth of subject matter covered",
      ],
      [
        "The abstract or executive summary (if present) accurately represents the body",
        "Bullet-point usage is restrained and purposeful rather than decorative",
        "The most critical insight receives the most prominent placement",
        "Consistent voice and register maintained throughout all sections",
      ],
      [
        "Strong use of sub-sections to prevent cognitive overload in dense content areas",
        "Active voice dominates — passive constructions are used sparingly",
        "Paragraph-level topic sentences are clear and set up evidence correctly",
        "Call-to-action placement at the close of key sections aids conversion",
      ],
    ],
    weaknessesPools: [
      [
        "The opening paragraph buries the core value proposition in sentence three",
        "Two middle sections run longer than necessary for the information density they carry",
      ],
      [
        "Transition sentences between Sections 2 and 3 are absent, creating an abrupt gear-change",
        "The conclusion largely restates the introduction rather than synthesising insights",
      ],
      [
        "Some subheadings are descriptive labels rather than benefit-driven statements",
        "The strongest supporting statistic appears too late — mid-document rather than early",
      ],
    ],
    recommendationsPools: [
      [
        "Move the core thesis to the first two sentences of the opening paragraph",
        "Cap body paragraphs at 80 words for this medium; split those that exceed this",
        "Rewrite the conclusion as a forward-looking synthesis, not a recap",
      ],
      [
        "Add a bridging sentence at the end of each major section pointing to the next",
        "Rework subheadings as reader-facing benefit statements where appropriate",
        "Test the document reading order by reading only the H2s — the story should be complete",
      ],
      [
        "Promote the strongest data point to the second paragraph of the introduction",
        "Reduce the background/context section by 20% to accelerate reader arrival at the core content",
        "Add a one-sentence 'key takeaway' at the end of each section for skimmers",
      ],
    ],
    baseConfidence: 74,
    confidenceRange: 20,
  },

  audience_specialist: {
    summaries: [
      (words, s) =>
        `Evaluated readability and audience fit across ${words} words. The tone is ${pick(["consistent and appropriately professional", "warm without sacrificing authority", "technically precise with moments that could be warmer"], s)}. Flesch-Kincaid analysis suggests a reading grade of ${pick(["11–13", "12–14", "10–12"], s)}, which is ${pick(["well-matched to a clinician audience", "slightly elevated for a patient-facing document", "appropriate for an informed lay audience"], s)}.`,
      (words, s) =>
        `Assessed audience alignment across ${words} words. The document's vocabulary register is ${pick(["well-calibrated for specialist readers", "inconsistently pitched — expert in places, overly casual in others", "accessible but occasionally dips into jargon without explanation"], s)}. Persona fit is ${pick(["strong", "moderate", "partial"], s > 5 ? s - 5 : 0)} overall.`,
      (words, s) =>
        `Performed a readability and persona-fit audit of the ${words}-word piece. The language level targets a ${pick(["graduate-educated professional", "motivated lay reader", "clinical practitioner"], s)} effectively. ${pick(["Several", "A handful of", "Two"], s)} technical terms appear without in-line definition, which may create friction for readers at the lower end of the target spectrum.`,
    ],
    strengthsPools: [
      [
        "Tone is consistent and appropriate — professional without being exclusionary",
        "Jargon is defined on first use in the majority of cases",
        "Sentence length variation keeps the rhythm from feeling monotonous",
        "Use of second person ('you') creates appropriate reader engagement",
      ],
      [
        "The document avoids patronising simplifications that could alienate expert readers",
        "Active constructions are favoured, reducing cognitive load",
        "Analogy use is well-timed and aids comprehension of complex mechanisms",
        "Cultural references are neutral — unlikely to create barriers for a diverse audience",
      ],
      [
        "Persona-specific vocabulary (pharmacist, clinician, researcher) is used consistently",
        "Length of sentences in high-complexity sections is managed well",
        "Numbered lists are used to simplify procedural guidance — appropriate format choice",
        "Accessibility considerations (avoiding idioms, clear antecedents) are largely met",
      ],
    ],
    weaknessesPools: [
      [
        "Two technical terms (identified in pass) appear without definition and should be glossed",
        "Paragraph 4 contains three sentences exceeding 30 words each — consider splitting",
      ],
      [
        "The document assumes prior familiarity with one regulatory acronym that is not expanded on first use",
        "Tone shifts subtly in the final section, becoming more formal and distancing",
      ],
      [
        "One section uses passive constructions in a way that obscures the responsible agent",
        "A complex mechanism description lacks a plain-language analogy that would help non-specialist readers",
      ],
    ],
    recommendationsPools: [
      [
        "Add parenthetical plain-language definitions beside the two undefined technical terms",
        "Break the three long sentences in the identified paragraph into shorter units of no more than 22 words",
        "Consider a 'Quick reference' box at the top for readers who need just the key actions",
      ],
      [
        "Expand all regulatory acronyms on first use and add a glossary appendix",
        "Restore tonal consistency in the final section — match the approachable register used in the body",
        "Test the document with a reader from the lower end of the target audience before final sign-off",
      ],
      [
        "Rewrite passive constructions to name the actor explicitly",
        "Add a plain-language analogy after the complex mechanism description",
        "Insert a readability score target (e.g., Flesch ≥ 45) into the editorial checklist",
      ],
    ],
    baseConfidence: 73,
    confidenceRange: 21,
  },

  public_health_advisor: {
    summaries: [
      (words, s) =>
        `Reviewed the ${words}-word document for population-level impact, equity implications, and health communication effectiveness. The content addresses a genuine public-health need. ${pick(["The behaviour-change framing is partially actionable", "Equity considerations are acknowledged but not operationalised", "The population scope is well-defined but could acknowledge access disparities more explicitly"], s)}.`,
      (words, s) =>
        `Assessed public health resonance and social determinants framing across ${words} words. The document is ${pick(["clinically strong but population-lens thin", "well-positioned for a professional audience with limited reach to underserved populations", "evidence-grounded with room to strengthen the equity dimension"], s)}. No stigmatising language was detected.`,
      (words, s) =>
        `Conducted a population-health review of this ${words}-word piece, focusing on health communication principles and equity. The messaging is ${pick(["clear and evidence-based", "well-intentioned but occasionally paternalistic in framing", "accessible for high-literacy audiences, with limited reach to lower-literacy populations"], s)}. The call-to-action could be more concrete and barrier-aware.`,
    ],
    strengthsPools: [
      [
        "No stigmatising language detected across the full document",
        "Message is broadly applicable across diverse care settings",
        "Risk communication follows best practice — harms are presented alongside benefits",
        "The document avoids fear-based framing, which is appropriate for behaviour-change goals",
      ],
      [
        "Health literacy principles are partially applied — key concepts are repeated and summarised",
        "The document acknowledges individual variability rather than making universal prescriptions",
        "Public-health framing correctly situates individual behaviour within systemic context",
        "Quantitative risks are presented in absolute terms, reducing numeracy-related misinterpretation",
      ],
      [
        "The intervention described is population-scalable — not limited to well-resourced settings",
        "Diverse demographic applicability is implied by the use of inclusive qualifying language",
        "The document correctly avoids commodity language that could prompt inequitable over-prescription",
        "Social determinants of health are acknowledged, even if not central to the main argument",
      ],
    ],
    weaknessesPools: [
      [
        "Access and equity barriers to the recommended intervention are not addressed",
        "Behaviour-change guidance lacks the concrete, barrier-aware framing needed for real-world application",
      ],
      [
        "The document is targeted at providers, with no guidance on patient-facing translation",
        "Health disparities across socioeconomic and racial lines are not surfaced, even where evidence exists",
      ],
      [
        "The primary focus on clinical outcomes underweights quality-of-life and patient-centred outcomes",
        "A prevention lens is absent — the content frames the issue as treatment-only",
      ],
    ],
    recommendationsPools: [
      [
        "Add a paragraph addressing access and affordability, and direct readers to relevant patient assistance resources",
        "Include one actionable, plain-language behaviour-change step for readers to share with patients",
        "Note the evidence base for underrepresented or high-risk subpopulations",
      ],
      [
        "Develop a companion patient-facing summary or direct to an existing one",
        "Surface the equity evidence — where disparities exist in the data, name them",
        "Add a 'Prevention and early intervention' perspective to balance the treatment focus",
      ],
      [
        "Integrate a social-determinants note that contextualises why outcomes vary across communities",
        "Replace passive recommendations ('patients should') with active, agent-specific ones ('Ask your pharmacist')",
        "Reference at least one community-health or population-level intervention alongside the clinical guidance",
      ],
    ],
    baseConfidence: 71,
    confidenceRange: 22,
  },

  creative_storytelling_editor: {
    summaries: [
      (words, s) =>
        `Reviewed narrative engagement and storytelling craft across ${words} words. The document's ${pick(["opening hook is functional but not memorable", "central narrative arc is clear but could be more emotionally resonant", "factual grounding is strong — the storytelling layer needs more depth"], s)}. The voice is consistent, and there is a genuine point of view, which is a strong foundation to build on.`,
      (words, s) =>
        `Assessed the engagement, story structure, and emotional resonance of this ${words}-word piece. The content is ${pick(["informative but reads primarily as a reference document rather than a compelling read", "well-structured with pockets of genuine narrative momentum that could be expanded", "factually rich but under-exploits the human stories embedded in the subject matter"], s)}.`,
      (words, s) =>
        `Completed a narrative and engagement audit of the ${words}-word document. ${pick(["The opening does not create a reader contract — no clear promise of value is made", "The middle section is the strongest — the opening and close need to match its energy", "Concrete examples and case vignettes are underused relative to the density of abstract claims"], s)}. The closing line does not yet deliver the emotional or intellectual payoff the content warrants.`,
    ],
    strengthsPools: [
      [
        "Voice is distinct, consistent, and authoritative without being inaccessible",
        "Concrete examples anchor abstract claims at appropriate intervals",
        "The document has a genuine point of view — it takes a position rather than just presenting facts",
        "Section transitions maintain narrative momentum rather than resetting to zero",
      ],
      [
        "The use of second person creates an effective reader–author relationship",
        "Rhetorical question use is restrained and well-placed for maximum impact",
        "One vivid analogy in the middle section makes a complex concept immediately tangible",
        "The document's implied story (problem → evidence → solution) is legible and satisfying",
      ],
      [
        "Short paragraph deployment is effective in high-intensity moments, controlling pacing well",
        "The subheadings contribute to the narrative rather than just labelling content",
        "A specific, memorable data point is used as a story anchor at the right moment",
        "The document avoids the common trap of saving the best content for the end",
      ],
    ],
    weaknessesPools: [
      [
        "The opening paragraph does not create a compelling reader contract",
        "The conclusion restates rather than synthesises — it should leave the reader with a new way of seeing",
      ],
      [
        "One extended abstract section in the middle loses narrative momentum — a brief case vignette would restore it",
        "The strongest data point appears too late to function as a hook",
      ],
      [
        "The document lacks a single unifying metaphor that would make it more memorable",
        "The call-to-action at the close is procedural rather than inspiring",
      ],
    ],
    recommendationsPools: [
      [
        "Rewrite the opening with a specific scenario, statistic, or question that creates immediate stakes",
        "Close with a single, memorable sentence that reframes the central insight — not a summary",
        "Add a two-to-three sentence case vignette at the start of the most abstract section",
      ],
      [
        "Move the strongest data point to the opening paragraph or the first heading",
        "Develop a unifying metaphor that can be introduced early and returned to at the close",
        "Rewrite the call-to-action as an invitation rather than an instruction",
      ],
      [
        "Consider a second-person scenario opener: 'Imagine a patient who...' frames the stakes immediately",
        "Test the closing line in isolation — it should work as a standalone quote",
        "Add one human detail (a patient stat, a practitioner challenge) to each major section",
      ],
    ],
    baseConfidence: 72,
    confidenceRange: 23,
  },
};

function generateSpecialistReview(agentKey: AgentKey, documentText: string): AgentReview {
  const template = AGENT_TEMPLATES[agentKey];
  const trimmed = documentText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const docSeed = hashString(documentText);
  const agentSeed = hashString(`${agentKey}:${documentText}`);

  // Pick variant pools deterministically per document
  const summaryFn = pick(template.summaries, docSeed);
  const strengthsPool = pick(template.strengthsPools, (docSeed >> 3) & 0xffff);
  const weaknessesPool = pick(template.weaknessesPools, (docSeed >> 7) & 0xffff);
  const recommendationsPool = pick(template.recommendationsPools, (docSeed >> 11) & 0xffff);

  // Always include the first two strengths; pick a third deterministically
  const strengths = [
    strengthsPool[0],
    strengthsPool[1],
    strengthsPool[2 + (agentSeed % (strengthsPool.length - 2))],
  ].filter(Boolean);

  return {
    summary: summaryFn(wordCount, agentSeed),
    strengths,
    weaknesses: weaknessesPool,
    recommendations: recommendationsPool,
    confidenceScore: template.baseConfidence + (agentSeed % template.confidenceRange),
  };
}

// ---------------------------------------------------------------------------
// Public agent runner — the ONLY function that changes when watsonx is wired
// up. Signature and return type are stable; everything else in the app remains
// unchanged.
// ---------------------------------------------------------------------------

/**
 * Staggered per-phase delays give the UI time to update between phases.
 * Total simulated review time: ~2–4 seconds per agent.
 */
const PHASE_DELAY_MS = [250, 550, 700, 450]; // preparing → reading → analyzing → generating

export async function runAgent(agentKey: AgentKey, documentText: string): Promise<AgentReview> {
  const seed = hashString(agentKey);
  // Each agent takes a slightly different total time to feel independent
  const jitter = seed % 600;
  const totalDelay = PHASE_DELAY_MS.reduce((a, b) => a + b, 0) + jitter;
  await new Promise((resolve) => setTimeout(resolve, totalDelay));
  return generateSpecialistReview(agentKey, documentText);
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Summary generation
// ---------------------------------------------------------------------------

/** Narrative snippets for the consensus section. */
const CONSENSUS_INTROS = [
  "After independent review, the council reached a strong working agreement:",
  "Following parallel analysis, all five specialists converged on a shared assessment:",
  "The council's independent reviews produced a coherent, mutually reinforcing picture:",
  "Five independent passes produced a high-confidence collective verdict:",
];

const CONSENSUS_CLOSES = [
  "The content is ready for final revision with targeted improvements applied.",
  "With the recommended changes addressed, this document is publication-ready.",
  "The identified improvements are tractable — no structural rework is required.",
  "A focused revision cycle addressing the recommendations below will bring this to publication standard.",
];

const FINAL_RECOMMENDATIONS = [
  "Prioritise the citation and evidence-sourcing pass first, as it underpins the credibility of all subsequent improvements.",
  "Begin with the structural revisions to establish a strong narrative frame, then layer in the audience and equity improvements.",
  "Address the readability and audience-fit notes first — they are highest-leverage for reach and comprehension.",
  "Start with the storytelling and engagement improvements, which will make the evidence-based content more compelling and retainable.",
];

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
      return `${agent?.name ?? r.agent_key} rated confidence notably ${direction} than the group average (${r.confidence_score ?? "—"} vs ${mean}).`;
    });

  // Collect the top recommendation from each completed agent (deduplicated)
  const recommendedImprovements = Array.from(
    new Set(completed.map((r) => r.recommendations[0]).filter((r): r is string => Boolean(r))),
  );

  // Build a richer, more narrative consensus
  const sessionSeed = hashString(sessionId);
  const confidenceLabel =
    mean >= 88
      ? "very high"
      : mean >= 80
        ? "high"
        : mean >= 72
          ? "solid"
          : mean >= 64
            ? "moderate"
            : "developing";

  const introLine = CONSENSUS_INTROS[sessionSeed % CONSENSUS_INTROS.length];
  const closeLine = CONSENSUS_CLOSES[(sessionSeed >> 2) % CONSENSUS_CLOSES.length];

  const consensus = completed.length
    ? `${introLine} ${completed.length} of ${COUNCIL_AGENTS.length} specialists completed their review with an average confidence of ${overallConfidence}/100 — a ${confidenceLabel} collective score. The document is well-sourced and logically structured. The primary opportunities for improvement lie in readability optimisation, richer storytelling, and stronger equity framing. ${closeLine}`
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

// ---------------------------------------------------------------------------
// Session orchestration
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Derived helpers (used by the UI layer — no business logic in components)
// ---------------------------------------------------------------------------

/** Returns the number of completed agents out of the total council size. */
export function countCompletedAgents(responses: AgentResponse[]): number {
  return responses.filter((r) => r.status === "completed").length;
}

/** Calculates the running council confidence from completed agents only. */
export function calcLiveConfidence(responses: AgentResponse[]): number | null {
  const done = responses.filter((r) => r.status === "completed" && r.confidence_score !== null);
  if (!done.length) return null;
  return Math.round(done.reduce((sum, r) => sum + (r.confidence_score ?? 0), 0) / done.length);
}

/** Returns a human-relative timestamp label for a given ISO date string. */
export function relativeTimestamp(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 5) return "Just now";
  if (secs < 60) return `${secs} seconds ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
}

/** Returns the current active phase label for a running agent. */
export function getRunningPhaseLabel(agentStartTime: string | null): string {
  if (!agentStartTime) return AGENT_PHASE_LABELS.preparing;
  const elapsed = Date.now() - new Date(agentStartTime).getTime();
  if (elapsed < 300) return AGENT_PHASE_LABELS.preparing;
  if (elapsed < 900) return AGENT_PHASE_LABELS.reading;
  if (elapsed < 1700) return AGENT_PHASE_LABELS.analyzing;
  return AGENT_PHASE_LABELS.generating;
}

export { FINAL_RECOMMENDATIONS };
