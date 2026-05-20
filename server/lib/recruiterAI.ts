import { getGeminiModel } from "../services/geminiService";
import { generateHash, getSemanticSimilarity, calculateTFIDFSimilarity } from "./matchingUtils";
import { extractRecognizedSkills, normalizeText } from "./skillOntology";

const getModel = () => {
  return getGeminiModel();
};

export interface RecruiterEvaluationResult {
  candidateScore: number;
  confidenceScore: number;
  skillsMatchScore: number;
  experienceRelevanceScore: number;
  projectRelevanceScore: number;
  educationAlignmentScore: number;
  resumeQualityScore: number;
  atsKeywordMatchPercentage: number;
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: string;
  interviewChance: number;
  offerProbability: number;
  skillGaps: string[];
  sectionReasons?: Record<string, string>;
  evaluatedJobTitle?: string;
}

const evaluationCache = new Map<string, RecruiterEvaluationResult>();

function calculateProbabilities(score: number, experienceScore: number): { interview: number, offer: number } {
  const interview = Math.round((0.7 * score) + (0.3 * experienceScore));
  const offer = Math.round(interview * 0.7);
  return {
    interview: Math.min(100, Math.max(0, interview)),
    offer: Math.min(100, Math.max(0, offer))
  };
}

function calculateQualityScore(resumeData: any): number {
  let score = 100;

  let hasBullets = false;
  let hasLargeParagraphs = false;
  let hasMetrics = false;
  let hasWeakVerbs = false;

  const weakVerbsList = ['helped', 'assisted', 'worked on', 'involved in', 'participated'];
  const metricsRegex = /\d+|%|percent|increased|reduced|improved|optimized/i;

  const checkText = (text: any) => {
    if (!text || typeof text !== 'string') return;
    if (text.includes('•') || text.includes('-')) hasBullets = true;
    if (text.length > 400 && !text.includes('\n')) hasLargeParagraphs = true;
    if (metricsRegex.test(text)) hasMetrics = true;
    if (weakVerbsList.some(v => text.toLowerCase().includes(v))) hasWeakVerbs = true;
  };

  const summary = resumeData.personal?.professionalSummary || "";
  checkText(summary);

  if (Array.isArray(resumeData.experience)) {
    resumeData.experience.forEach((exp: any) => {
      if (Array.isArray(exp.responsibilities)) {
        hasBullets = true;
        exp.responsibilities.forEach((r: string) => checkText(r));
      } else if (typeof exp.responsibilities === 'string') {
        checkText(exp.responsibilities);
      }
    });
  }

  if (Array.isArray(resumeData.projects)) {
    resumeData.projects.forEach((proj: any) => checkText(proj.description));
  }

  if (!hasBullets) score -= 15;
  if (hasLargeParagraphs) score -= 10;
  if (!hasMetrics) score -= 10;
  if (hasWeakVerbs) score -= 5;

  return Math.min(100, Math.max(0, score));
}

function calculateCompleteness(resumeData: any): number {
  let score = 0;
  if (resumeData.personal && typeof resumeData.personal.professionalSummary === 'string' && resumeData.personal.professionalSummary.trim().length > 0) score += 20;
  if (Array.isArray(resumeData.experience) && resumeData.experience.length > 0) score += 20;
  if (Array.isArray(resumeData.projects) && resumeData.projects.length > 0) score += 20;
  if (Array.isArray(resumeData.education) && resumeData.education.length > 0) score += 20;
  if (Array.isArray(resumeData.skills) && resumeData.skills.length > 0) score += 20;
  return score;
}

function calculateExperienceScore(resumeData: any, relevanceScore: number): number {
  let roleLevelScore = 35;

  if (Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
    let isInternship = false;
    let hasSeniorTitle = false;
    let rolesCount = resumeData.experience.length;

    resumeData.experience.forEach((exp: any) => {
      const title = (exp?.title || exp?.role || "").toLowerCase();
      if (title.includes("intern")) isInternship = true;
      if (title.includes("senior") || title.includes("lead") || title.includes("manager") || title.includes("principal")) hasSeniorTitle = true;
    });

    if (hasSeniorTitle || rolesCount >= 3) roleLevelScore = 90;
    else if (rolesCount === 1 && isInternship) roleLevelScore = 55;
    else roleLevelScore = 75;
  }

  return Math.min(100, Math.max(0, (roleLevelScore * 0.6) + (relevanceScore * 0.4)));
}

function extractTextField(resumeData: any, field: string): string {
  if (!resumeData || !resumeData[field]) return "";
  if (Array.isArray(resumeData[field])) {
    return resumeData[field].map((f: any) => JSON.stringify(f)).join(" ");
  }
  return JSON.stringify(resumeData[field]);
}

function extractKeywords(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const words = text.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/);
  const stopWords = new Set(["the", "and", "or", "to", "of", "a", "in", "for", "with", "on", "is", "as", "be", "this", "that", "are", "by", "an", "it", "from", "at", "your", "you", "we", "will", "can", "about", "have", "has", "had", "not", "but", "they", "their", "what", "which", "who", "when", "where", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "our", "us", "if", "then", "else", "do", "does", "did", "job", "role", "looking", "candidate", "ideal", "description", "requirements", "responsibilities"]);
  return Array.from(new Set(words.filter(w => w.length > 2 && !stopWords.has(w))));
}

function extractDomainKeywords(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const words = text.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/);
  const stopWords = new Set(["the", "and", "or", "to", "of", "a", "in", "for", "with", "on", "is", "as", "be", "this", "that", "are", "by", "an", "it", "from", "at", "your", "you", "we", "will", "can", "about", "have", "has", "had", "not", "but", "they", "their", "what", "which", "who", "when", "where", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "our", "us", "if", "then", "else", "do", "does", "did", "job", "role", "looking", "candidate", "ideal", "description", "requirements", "responsibilities"]);
  const genericVerbs = new Set(["build", "built", "develop", "developed", "manage", "managed", "create", "created", "lead", "led", "work", "worked", "use", "used", "make", "made", "help", "helped", "assist", "assisted", "support", "supported", "design", "designed", "implement", "implemented", "ensure", "ensured", "provide", "provided", "maintain", "maintained", "improve", "improved", "increase", "increased"]);
  return Array.from(new Set(words.filter(w => w.length > 2 && !stopWords.has(w) && !genericVerbs.has(w))));
}

function extractHighImpactKeywords(jobDescription: string): string[] {
  const words = jobDescription
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ");

  const stopWords = new Set([
    "the", "and", "or", "to", "of", "a", "in", "for", "with", "on", "is", "as", "be",
    "this", "that", "are", "by", "an", "it", "from", "at", "your", "you", "we", "will",
    "can", "about", "have", "has", "had", "not", "but", "they", "their"
  ]);

  const filtered = words.filter(w => w.length > 3 && !stopWords.has(w));
  const freq: Record<string, number> = {};
  filtered.forEach(word => { freq[word] = (freq[word] || 0) + 1; });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 12);
}

// ─── Extracts the job title from the JD using Gemini ───────────────────────
async function extractJobTitleAI(jobDescription: string): Promise<string> {
  try {
    const model = getModel();
    const prompt = `Extract the exact job title from this job description. Return ONLY the job title, nothing else.\n\nJob Description:\n${jobDescription}`;
    const result = await model?.generateContent(prompt);
    const text = (await result?.response.text())?.trim();
    return text || "Professional";
  } catch {
    return "Professional";
  }
}

// ─── Builds a proper role-aware fallback summary ────────────────────────────
function buildFallbackSummary(role: string, keywords: string[]): string {
  const topKeywords = keywords.slice(0, 5).join(", ");
  return `Results-driven ${role} with proven expertise in ${topKeywords}. Demonstrated ability to deliver measurable impact aligned with organizational goals.`;
}

export async function evaluateResume(
  resumeData: any,
  jobDescription: string,
  targetJobTitle: string
): Promise<RecruiterEvaluationResult> {

  const requiredSkills = extractRecognizedSkills(jobDescription);
  const jdKeywords = extractKeywords(jobDescription);

  const resumeSkillsText = Array.isArray(resumeData.skills)
    ? resumeData.skills.map((s: any) => typeof s === "string" ? s : s.name).join(" ")
    : "";

  const possessedSkills = extractRecognizedSkills(resumeSkillsText);

  const fullResumeText = `
    ${resumeData.personal?.professionalSummary || ""}
    ${extractTextField(resumeData, "experience")}
    ${extractTextField(resumeData, "projects")}
    ${resumeSkillsText}
  `;

  // Skill boost
  let skillBoost = 0;
  const importantSkills = [...requiredSkills, ...jdKeywords.slice(0, 5)];
  importantSkills.forEach(skill => {
    if (fullResumeText.toLowerCase().includes(skill.toLowerCase())) skillBoost += 2;
  });
  const matchedImportantSkills = requiredSkills.filter(skill => possessedSkills.includes(skill));
  skillBoost += matchedImportantSkills.length * 2;
  skillBoost = Math.min(skillBoost, 12);

  const matchedSkills = requiredSkills.filter(skill =>
    possessedSkills.some(ps =>
      ps.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(ps.toLowerCase())
    )
  );
  const missingSkills = requiredSkills.filter(skill =>
    !possessedSkills.some(ps =>
      ps.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(ps.toLowerCase())
    )
  );

  // Critical skill penalty
  let criticalSkillPenalty = 0;
  if (requiredSkills.length > 0) {
    const missingRatio = missingSkills.length / requiredSkills.length;
    if (missingRatio > 0.6) criticalSkillPenalty = -15;
    else if (missingRatio > 0.3) criticalSkillPenalty = -8;
  }

  // ATS score
  const resumeTextWords = extractKeywords(fullResumeText);
  const matchedKeywords = jdKeywords.filter(k =>
    resumeTextWords.some(r => r.includes(k) || k.includes(r))
  );
  const tfIdfScore = Number(calculateTFIDFSimilarity(fullResumeText, jobDescription)) * 100;

  let semanticScore = 0;
  try {
    const semanticScoreRaw = await getSemanticSimilarity(fullResumeText, jobDescription);
    semanticScore = Number(semanticScoreRaw) || 0;
  } catch (err) {
    console.warn("Semantic similarity failed, fallback to 0");
    semanticScore = 0;
  }

  const keywordRatio = jdKeywords.length === 0 ? 0 : (matchedKeywords.length / jdKeywords.length) * 100;

  let atsKeywordMatchPercentage = Math.min(100, Math.round(
    (0.5 * tfIdfScore) + (0.2 * keywordRatio) + (0.3 * semanticScore * 100)
  ));

  let skillsMatchScore = requiredSkills.length === 0 ? 0 : (matchedSkills.length / requiredSkills.length) * 100;
  skillsMatchScore = Math.round(skillsMatchScore);

  // Experience score
  const expText = extractTextField(resumeData, "experience");
  const expKeywords = extractKeywords(expText);
  const matchedExpKeywords = jdKeywords.filter(k => expKeywords.includes(k));
  const rawExpRelevance = jdKeywords.length === 0 ? 0 : (matchedExpKeywords.length / jdKeywords.length) * 100;
  let experienceRelevanceScore = Math.round(calculateExperienceScore(resumeData, rawExpRelevance));

  let experienceBoost = 0;
  if (experienceRelevanceScore > 80) experienceBoost += 5;
  if (experienceRelevanceScore > 60) experienceBoost += 3;

  // Project score
  const projText = extractTextField(resumeData, "projects");
  const projKeywords = extractKeywords(projText);
  const matchedProjKeywords = jdKeywords.filter(k => projKeywords.includes(k));
  const projRelevance = jdKeywords.length === 0 ? 0 : (matchedProjKeywords.length / jdKeywords.length) * 100;

  let projectQuality = 0;
  if (Array.isArray(resumeData.projects) && resumeData.projects.length > 0) {
    projectQuality = 50;
    if (resumeData.projects.some((p: any) => Array.isArray(p.techStack) && p.techStack.length > 0)) projectQuality += 25;
    if (resumeData.projects.some((p: any) => (p.description || "").length > 50)) projectQuality += 25;
  }
  let projectRelevanceScore = Math.round((0.7 * projRelevance) + (0.3 * projectQuality));

  let projectBoost = 0;
  if (projectRelevanceScore > 80) projectBoost += 5;
  else if (projectRelevanceScore > 60) projectBoost += 3;

  // Education score
  const eduText = extractTextField(resumeData, "education");
  const eduKeywords = extractKeywords(eduText);
  const matchedEduKeywords = jdKeywords.filter(k => eduKeywords.includes(k));
  const eduRelevance = jdKeywords.length === 0 ? 0 : (matchedEduKeywords.length / jdKeywords.length) * 100;

  let educationQuality = 0;
  if (Array.isArray(resumeData.education) && resumeData.education.length > 0) {
    educationQuality = 60;
    if (resumeData.education.some((e: any) => !!e.gpa)) educationQuality += 20;
    if (resumeData.education.some((e: any) => !!e.institution)) educationQuality += 20;
  }
  let educationAlignmentScore = Math.round((0.7 * eduRelevance) + (0.3 * educationQuality));

  const resumeQualityScore = Math.round(calculateQualityScore(resumeData));

  // Domain mismatch — soft penalty only
  const domainJdKeywords = extractDomainKeywords(jobDescription);
  const domainResumeKeywords = extractDomainKeywords(fullResumeText);
  const matchedDomainKeywords = domainJdKeywords.filter(k => domainResumeKeywords.includes(k));
  const domainMatchScore = domainJdKeywords.length === 0 ? 0 : (matchedDomainKeywords.length / domainJdKeywords.length) * 100;

  // Soft penalty — never cut below 0.8x so a score can't collapse to 25
  if (domainMatchScore < 30) {
    atsKeywordMatchPercentage = Math.round(atsKeywordMatchPercentage * 0.8);
    skillsMatchScore = Math.round(skillsMatchScore * 0.8);
  } else if (domainMatchScore <= 60) {
    atsKeywordMatchPercentage = Math.round(atsKeywordMatchPercentage * 0.9);
    skillsMatchScore = Math.round(skillsMatchScore * 0.9);
  }

  const rawScore = (
    (skillsMatchScore * 0.30) +
    (experienceRelevanceScore * 0.25) +
    (projectRelevanceScore * 0.20) +
    (atsKeywordMatchPercentage * 0.15) +
    (educationAlignmentScore * 0.10)
  );

  const semanticBoost = semanticScore * 10;
  let candidateScore = Math.round(
    Math.min(98, Math.max(25,
      rawScore + semanticBoost + skillBoost + experienceBoost + projectBoost + criticalSkillPenalty
    ))
  );

  if (skillsMatchScore > 60 && atsKeywordMatchPercentage > 50) {
    candidateScore = Math.max(candidateScore, 60);
  }

  const completeness = calculateCompleteness(resumeData);
  let confidenceScore = Math.round(
    (completeness * 0.40) + (atsKeywordMatchPercentage * 0.30) + (resumeQualityScore * 0.30)
  );
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));
  if (completeness < 60) confidenceScore = Math.min(70, confidenceScore);

  const interviewChance = Math.round((0.7 * candidateScore) + (0.3 * experienceRelevanceScore));
  const offerProbability = Math.round(interviewChance * 0.7);

  const baseStrengths: string[] = [];
  const baseWeaknesses: string[] = [];

  if (skillsMatchScore >= 80) baseStrengths.push("Excellent target skill alignment.");
  else if (skillsMatchScore < 60) baseWeaknesses.push("Missing core job skills.");
  if (experienceRelevanceScore >= 80) baseStrengths.push("Strong relevant experience.");
  else if (experienceRelevanceScore < 60) baseWeaknesses.push("Experience level is low or unrelated.");
  if (projectRelevanceScore >= 80) baseStrengths.push("Highly relevant projects.");
  else if (projectRelevanceScore < 60) baseWeaknesses.push("Lack of relevant projects.");
  if (atsKeywordMatchPercentage >= 80) baseStrengths.push("Excellent ATS keyword optimization.");
  else if (atsKeywordMatchPercentage < 60) baseWeaknesses.push("Poor ATS keyword match.");
  if (resumeQualityScore >= 80) baseStrengths.push("Strong resume formatting and metrics.");
  else if (resumeQualityScore < 60) baseWeaknesses.push("Formatting or structure limits readability.");

  let model;
  try {
    model = getModel();
  } catch (err) {
    console.error("Model init failed:", err);
  }

  const prompt = `
You are an expert AI Tech Recruiter. The resume has already been algorithmically scored.
DO NOT recalculate the scores.
Your ONLY job is to write 1-2 sentence short human-readable explanations, strengths, and weaknesses strictly based ON THE PROVIDED SCORES.
Also, dynamically extract the exact job role or title derived from the "Job Description" text, ignoring the original targetJobTitle. Provide this in the "extractedJobTitle" field.

Scores Provided:
- Target Job: ${targetJobTitle}
- Candidate Overall Score: ${candidateScore} / 100
- Core Base Strengths Detected: ${baseStrengths.join(" | ")}
- Core Base Weaknesses Detected: ${baseWeaknesses.join(" | ")}
Missing Skills: ${missingSkills.slice(0, 5).join(", ")}

Generate ONLY a JSON object matching this schema exactly:
{
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "hiringRecommendation": "A short 1-sentence recommendation based on the score",
  "sectionReasons": {
    "skills": "Reason for skill score",
    "experience": "Reason for experience score",
    "projects": "Reason for project score"
  },
  "extractedJobTitle": "The exact role derived from the Job Description"
}
`;

  let llmOutputs = {
    strengths: baseStrengths.length > 0 ? baseStrengths : ["Well formatted resume."],
    weaknesses: baseWeaknesses.length > 0 ? baseWeaknesses : ["No major red flags."],
    hiringRecommendation: candidateScore >= 75
      ? "Strong candidate for an interview — consider moving forward."
      : "Needs more relevant experience or targeted skills to proceed.",
    sectionReasons: {
      skills: `Matched ${matchedSkills.length} of ${requiredSkills.length} required skills.`,
      experience: `Experience evaluated at ${Math.round(experienceRelevanceScore)}% relevance vs Job Description.`,
      projects: `Project relevance and quality evaluated at ${Math.round(projectRelevanceScore)}%.`
    }
  };

  try {
    if (model) {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" }
      });
      const response = await result.response;
      const text = response.text();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.strengths) llmOutputs = parsed;
    }
  } catch (err) {
    console.error("LLM reasoning failed, using fallback:", err);
  }

  return {
    candidateScore,
    confidenceScore,
    skillsMatchScore: Math.round(skillsMatchScore),
    experienceRelevanceScore: Math.round(experienceRelevanceScore),
    projectRelevanceScore: Math.round(projectRelevanceScore),
    educationAlignmentScore: Math.round(educationAlignmentScore),
    resumeQualityScore: Math.round(resumeQualityScore),
    atsKeywordMatchPercentage: Math.round(atsKeywordMatchPercentage),
    strengths: llmOutputs.strengths || [],
    weaknesses: llmOutputs.weaknesses || [],
    hiringRecommendation: llmOutputs.hiringRecommendation || "",
    interviewChance,
    offerProbability,
    skillGaps: missingSkills.slice(0, 5),
    sectionReasons: llmOutputs.sectionReasons,
    evaluatedJobTitle: (llmOutputs as any).extractedJobTitle || targetJobTitle
  };
}

// =========================
// RESUME OPTIMIZER FUNCTION
// =========================

export async function improveResumeForJob(
  resumeData: any,
  jobDescription: string,
  targetJobTitle: string
): Promise<{
  optimized_resume: any;
  improvements: string[];
}> {
  const requiredSkills = extractRecognizedSkills(jobDescription);
  const highImpactKeywords = extractHighImpactKeywords(jobDescription);

  // Always extract the real role from the JD — never use a hardcoded fallback string
  let extractedRole = targetJobTitle || "Professional";
  try {
    const aiRole = await extractJobTitleAI(jobDescription);
    if (aiRole && aiRole.length > 2) extractedRole = aiRole;
  } catch {
    // keep extractedRole as targetJobTitle
  }

  try {
    const model = getModel();

    const prompt = `
You are a FAANG-level AI recruiter and resume expert.

Your task: Rewrite and optimize the resume to EXACTLY match the job description.

STRICT RULES:
- Return ONLY valid JSON — no markdown, no explanation, no extra text
- Preserve the EXACT same JSON structure as the input resume
- For each experience entry, keep the same "id" field — only rewrite "responsibilities"
- For each project entry, keep the same "id" field — only rewrite "description"
- Use strong action verbs: Developed, Engineered, Led, Optimized, Built, Managed, Analyzed
- Add METRICS wherever possible (%, $, improvements, scale, performance)
- Align skills EXACTLY with the job description requirements
- Tailor the professional summary to match the job role precisely
- DO NOT fabricate companies, dates, degrees, or job titles the candidate never had

Job Title: ${extractedRole}
Job Description:
${jobDescription}

Current Resume (preserve IDs exactly):
${JSON.stringify(resumeData, null, 2)}

Return this JSON structure:
{
  "optimized_resume": {
    "personal": {
      "professionalSummary": "rewritten strong summary tailored to ${extractedRole}"
    },
    "skills": ["skill1", "skill2", "..."],
    "experience": [
      {
        "id": "<same id as input>",
        "responsibilities": ["bullet 1 with metrics", "bullet 2 with action verb"]
      }
    ],
    "projects": [
      {
        "id": "<same id as input>",
        "description": "rewritten description with measurable impact"
      }
    ]
  },
  "improvements": ["summary rewritten for ${extractedRole} role", "..."]
}
`;

    if (model) {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const parsed = JSON.parse(text);
      const optimized = parsed.optimized_resume || parsed.optimizedResume || parsed.resume;
      const improvements: string[] = parsed.improvements || ["Resume optimized for the target role."];

      if (optimized) {
        return { optimized_resume: optimized, improvements };
      }
    }

    // If model returned nothing usable, fall through to rule-based fallback
    throw new Error("Model returned no usable output");

  } catch (error: any) {
    console.error("Optimizer AI call failed, using rule-based fallback:", error);

    // ─── Rule-based fallback ────────────────────────────────────────────────
    // Uses template literals correctly — extractedRole is resolved at runtime
    const improvements: string[] = [];

    const newSummary = buildFallbackSummary(extractedRole, highImpactKeywords);
    const summaryChanged = newSummary !== resumeData.personal?.professionalSummary;
    if (summaryChanged) improvements.push(`Summary rewritten for ${extractedRole} role`);

    // Skills: add missing required skills that appear in resume text
    const fullResumeText = `
      ${resumeData.personal?.professionalSummary || ""}
      ${JSON.stringify(resumeData.experience || [])}
      ${JSON.stringify(resumeData.projects || [])}
    `;
    const existingSkillNames = new Set(
      (resumeData.skills || []).map((s: any) =>
        (typeof s === "string" ? s : s.name ?? "").toLowerCase()
      )
    );
    const relevantNewSkills = requiredSkills.filter(skill =>
      !existingSkillNames.has(skill.toLowerCase()) &&
      fullResumeText.toLowerCase().includes(skill.toLowerCase())
    );
    if (relevantNewSkills.length > 0) {
      improvements.push(`Added ${relevantNewSkills.length} relevant skills: ${relevantNewSkills.slice(0, 4).join(", ")}`);
    }

    // Experience: strengthen bullet points with action verbs + metrics
    const weakToStrong: Record<string, string> = {
      "worked on": "Developed",
      "helped": "Contributed to",
      "assisted": "Collaborated on",
      "made": "Built",
      "did": "Executed",
      "was responsible for": "Managed",
    };

    const improvedExperience = Array.isArray(resumeData.experience)
      ? resumeData.experience.map((exp: any) => {
        const oldResponsibilities: string[] = Array.isArray(exp.responsibilities)
          ? exp.responsibilities
          : [];

        const newResponsibilities = oldResponsibilities.map((r: string) => {
          let updated = r.trim();

          // Replace weak opening verbs
          for (const [weak, strong] of Object.entries(weakToStrong)) {
            if (updated.toLowerCase().startsWith(weak)) {
              updated = strong + updated.slice(weak.length);
              break;
            }
          }

          // Add a job-relevant keyword if missing
          const keyword = highImpactKeywords.find(k =>
            !updated.toLowerCase().includes(k.toLowerCase())
          );
          if (keyword) updated += ` leveraging ${keyword}`;

          // Add a metric if none present
          if (!/\d+|%|percent/i.test(updated)) {
            const impact = 10 + (r.length % 25);
            updated += `, improving efficiency by ${impact}%`;
          }

          return updated;
        });

        return { ...exp, responsibilities: newResponsibilities };
      })
      : resumeData.experience;

    let expBulletsChanged = 0;
    if (Array.isArray(resumeData.experience)) {
      resumeData.experience.forEach((exp: any, i: number) => {
        const orig = exp.responsibilities || [];
        const next = improvedExperience[i]?.responsibilities || [];
        orig.forEach((r: string, j: number) => { if (r !== next[j]) expBulletsChanged++; });
      });
    }
    if (expBulletsChanged > 0) {
      improvements.push(`Rewrote ${expBulletsChanged} experience bullet points with stronger action verbs and metrics`);
    }

    if (improvements.length === 0) {
      improvements.push("Optimized keyword alignment for better ATS match");
    }

    const optimized = {
      ...resumeData,
      personal: {
        ...resumeData.personal,
        professionalSummary: newSummary,
      },
      skills: (() => {
        const existingSkills = resumeData.skills || [];
        const newOnes = relevantNewSkills.map((name, idx) => ({
          id: `fallback-skill-${Date.now()}-${idx}`,
          name,
          category: "tools" as const,
          level: "intermediate" as const,
          order: existingSkills.length + idx,
        }));
        return [...existingSkills, ...newOnes];
      })(),
      experience: improvedExperience,
    };

    return { optimized_resume: optimized, improvements };
  }
}