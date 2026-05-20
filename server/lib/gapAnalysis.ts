import { callWithRetry } from "./gemini.ts";
import { ResumeData } from "../../client/src/types/resume.ts";

interface JDExtraction {
  skills: string[];
  keywords: string[];
  sections: string[];
  jobTitle: string;
}

export interface GapAnalysisResponse {
  overall_match: number;
  domain_match_percentage: number;
  penalty_applied: boolean;
  sections: Record<string, {
    score: number;
    status: "strong" | "weak" | "missing";
    missing_keywords: string[];
    suggestion: string;
  }>;
}

// Helper: Cosine Similarity
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

// Helper: Call Python TF-IDF microservice
async function getSBERTEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await fetch("http://localhost:5001/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: texts }),
    });
    if (!response.ok) throw new Error("SBERT Server Error");
    return await response.json();
  } catch (error) {
    console.error("TF-IDF Microservice failed. Fallback to zeroes.", error);
    // Return zero arrays as fallback
    return texts.map(() => new Array(384).fill(0.001)); 
  }
}

// 1. Extract requirements from Job Description using Gemini
async function extractJDRequirements(jobDescription: string): Promise<JDExtraction> {
  const prompt = `
    Analyze the following research role or academic job posting. 
    Extract the following into STRICT JSON format with exactly these keys:
    - "jobTitle": extracted job title
    - "skills": array of required core skills/methodologies (max 10)
    - "keywords": array of general important keywords (max 15)
    - "sections": array of sections explicitly or implicitly required (e.g. ["Publications", "Research Experience", "Grants/Awards"])
    
    Job Description:
    ${jobDescription}

    Return ONLY raw JSON. No markdown.
  `;
  try {
    const response = await callWithRetry(prompt);
    const cleanText = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText) as JDExtraction;
  } catch (error) {
    console.error("JD Extraction failed:", error);
    return { skills: [], keywords: [], sections: [], jobTitle: "Professional" };
  }
}

// 2. Map ResumeData to logical sections
function getResumeSectionsText(resume: any): Record<string, string> {
  const formatArray = (arr: any[], key: string) => arr && Array.isArray(arr) ? arr.map(item => item[key] || item.description || JSON.stringify(item)).join(" . ") : "";
  
  // Handle CVFormData flat education format
  let educationStr = "";
  if (Array.isArray(resume.education)) {
     educationStr = resume.education.map((e:any) => `${e.degree || ''} ${e.specialization || ''} ${e.institution || ''}`).join(". ");
  } else if (resume.education) {
     educationStr = `${resume.education} ${resume.educationSchool || ''} ${resume.educationYear || ''}`;
  }

  // Handle CVFormData flat skills vs ResumeData structured skills
  let skillsStr = "";
  if (Array.isArray(resume.skills)) {
      skillsStr = resume.skills.map((s:any) => s.name).join(", ");
  } else if (typeof resume.skills === "string") {
      skillsStr = resume.skills;
  }
  if (resume.structuredSkills?.raw) {
      skillsStr += " " + resume.structuredSkills.raw;
  }

  // Handle experiences
  const expArray = resume.experience || resume.experiences || [];
  const projArray = resume.projects || [];

  return {
    "Professional Summary": resume.personal?.professionalSummary || resume.summary || "",
    "Research Experience": formatArray(expArray, "responsibilities"),
    "Skills": skillsStr,
    "Education": educationStr,
    "Projects & Publications": formatArray(projArray, "description"),
    "Certifications & Awards": resume.certifications ? formatArray(resume.certifications, "name") : "",
  };
}

// 3. Main analysis function
export async function performGapAnalysis(jobDescription: string, resume: ResumeData): Promise<GapAnalysisResponse> {
  const jdExtracted = await extractJDRequirements(jobDescription);
  
  const resumeSections = getResumeSectionsText(resume);
  const sectionKeys = Object.keys(resumeSections);
  
  // Prepare texts for embeddings: First the JD, then all resume sections
  const textsToEmbed = [jobDescription, ...sectionKeys.map(k => resumeSections[k])];
  const embeddings = await getSBERTEmbeddings(textsToEmbed);
  
  const jdEmbedding = embeddings[0];
  const sectionEmbeddings = embeddings.slice(1);

  const reportSections: GapAnalysisResponse["sections"] = {};
  
  let totalScore = 0;
  let validSectionsCount = 0;

  // Domain Mismatch calculation base
  const allResumeText = Object.values(resumeSections).join(" ").toLowerCase();
  
  for (let i = 0; i < sectionKeys.length; i++) {
    const sectionName = sectionKeys[i];
    const sectionText = resumeSections[sectionName];
    const secEmbedding = sectionEmbeddings[i];
    
    if (!sectionText || sectionText.trim() === "") {
        reportSections[sectionName] = {
            score: 0,
            status: "missing",
            missing_keywords: jdExtracted.keywords.slice(0, 5),
            suggestion: `You are missing a ${sectionName} section. Consider adding relevant details.`,
        };
        continue;
    }

    // Semantic Score using Python TF-IDF output
    const semanticScore = cosineSimilarity(jdEmbedding, secEmbedding);
    
    // Keyword Match processing per section
    const sectionWords = sectionText.toLowerCase();
    const matchedKeywords = jdExtracted.keywords.filter(k => sectionWords.includes(k.toLowerCase()));
    const missingKeywords = jdExtracted.keywords.filter(k => !sectionWords.includes(k.toLowerCase()));
    
    const keywordRatio = jdExtracted.keywords.length > 0 ? (matchedKeywords.length / jdExtracted.keywords.length) : 0;
    
    // Math.round((0.7 * TF-IDF Semantic Score) + (0.3 * Keyword Match Ratio))
    const rawScore = (0.7 * semanticScore) + (0.3 * keywordRatio);
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore * 100)));
    
    let status: "strong" | "weak" | "missing" = "strong";
    let suggestion = "Great job on this section.";
    
    if (finalScore < 50) {
      status = "weak";
      // Ask Gemini for a rewrite suggestion since it's weak
      const prompt = `
        The applicant's ${sectionName} section is weak compared to the Job Description.
        Job Title: ${jdExtracted.jobTitle}
        Missing Keywords: ${missingKeywords.slice(0, 5).join(", ")}
        Current Text: ${sectionText}
        Provide a 2-sentence specific, actionable suggestion to improve this section.
      `;
      try {
          const res = await callWithRetry(prompt);
          suggestion = res.text().replace(/`/g, "").trim();
      } catch (err) {
          suggestion = `Include keywords like: ${missingKeywords.slice(0, 3).join(", ")}`;
      }
    } else if (finalScore < 75) {
      status = "weak";
      suggestion = `Consider adding stronger action verbs and mentioning: ${missingKeywords.slice(0, 3).join(", ")}`;
    }

    reportSections[sectionName] = {
      score: finalScore,
      status,
      missing_keywords: missingKeywords.slice(0, 5), // Provide top 5 missing
      suggestion
    };
    
    totalScore += finalScore;
    validSectionsCount++;
  }

  // Overall Score Calculation
  let overallMatch = validSectionsCount > 0 ? Math.round(totalScore / validSectionsCount) : 0;
  
  // Domain Match Percentage
  const matchedDomainKeywords = jdExtracted.keywords.filter(k => allResumeText.includes(k.toLowerCase()));
  const domainMatchPercentage = jdExtracted.keywords.length > 0 
    ? Math.round((matchedDomainKeywords.length / jdExtracted.keywords.length) * 100) 
    : 100;
  
  let penaltyApplied = false;
  if (domainMatchPercentage < 20) {
      overallMatch = Math.min(overallMatch, 25);
      penaltyApplied = true;
  } else if (domainMatchPercentage < 30) {
      overallMatch = Math.round(overallMatch * 0.45); // 0.4x - 0.5x modifier
      penaltyApplied = true;
  }

  return {
    overall_match: overallMatch,
    domain_match_percentage: domainMatchPercentage,
    penalty_applied: penaltyApplied,
    sections: reportSections
  };
}
