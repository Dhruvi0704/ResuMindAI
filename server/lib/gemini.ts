import { getGeminiModel } from "../services/geminiService";

async function callGemini(prompt: string) {
    const aiModel = getGeminiModel();
    const result = await aiModel.generateContent(prompt);
    return result.response;
}

export async function callWithRetry(prompt: string) {
    const maxRetries = 3;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await callGemini(prompt);
        } catch (error: any) {
            lastError = error;
            console.log(`Gemini Error on attempt ${i + 1}:`, error.message);
            
            if (i < maxRetries - 1) {
                if (error.status === 429 || error.message?.includes("quota") || error.message?.toLowerCase().includes("rate limit")) {
                    console.warn(`Quota exceeded, retrying in 2s...`);
                    await new Promise(res => setTimeout(res, 2000));
                } else {
                    console.warn(`Gemini call failed, retrying...`);
                    await new Promise(res => setTimeout(res, 1000));
                }
            }
        }
    }

    console.error("All Gemini retries failed. Last error:", lastError?.message);
    throw lastError;
}

interface CVAnalysisResponse {
    score: number;
    metrics: {
        contentQuality: number;
        keywordOptimization: number;
        formattingStructure: number;
        achievementsImpact: number;
        atsCompatibility: number;
    };
    feedback: {
        section: string;
        issue: string;
        suggestion: string;
        priority: "high" | "medium" | "low";
    }[];
    strengths: string[];
    weaknesses: string[];
    missingKeywords: string[];
}

export async function analyzeCV(text: string, targetRole: string = "Professional"): Promise<CVAnalysisResponse> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const prompt = `
    You are an expert ATS (Applicant Tracking System) and professional resume writer. 
    Analyze the following resume text deeply against the target role of: ${targetRole}.

    Provide a structured analysis in JSON format with exactly these keys:
    1. "score" (number 0-100)
    2. "metrics" (object containing exactly these 5 keys (0-100 scores): "contentQuality", "keywordOptimization", "formattingStructure", "achievementsImpact", "atsCompatibility")
    3. "feedback" (array of objects with keys: "section", "issue", "suggestion", "priority". Make the suggestions highly specific and actionable, e.g. "Rewrite experience bullets to include measurable achievements such as performance improvements, revenue impact, or efficiency gains.")
    4. "strengths" (array of strings, e.g. ["Strong technical skills", "Clear project descriptions"])
    5. "weaknesses" (array of strings, e.g. ["Missing measurable achievements", "Generic job descriptions"])
    6. "missingKeywords" (array of strings, listing important keywords missing for the target role)

    Resume Text:
    ${text.substring(0, 15000)}

    Return ONLY raw JSON. No markdown formatting.
  `;

    try {
        const response = await callWithRetry(prompt);
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw new Error("Failed to analyze CV with AI");
    }
}

export async function rewriteSection(text: string, sectionType: "summary" | "experience" | "skills"): Promise<string> {
    const prompt = `
    Rewrite the following ${sectionType} for a professional resume.
    Make it concise, impactful, and use strong action verbs.
    For experience, emphasize achievements and metrics.
    
    Text:
    ${text}

    Return only the rewritten text.
  `;

    try {
        const response = await callWithRetry(prompt);
        return response.text();
    } catch (error) {
        console.error("Gemini Rewrite Error:", error);
        throw new Error("Failed to rewrite content");
    }
}

interface EnhancementRequest {
    originalText: string;
    sectionType: string;
    jobRole: string;
    experienceLevel: string;
    actionType?: "grammar" | "professional" | "shorten" | "enhance";
}

export async function enhanceResumeSection(request: EnhancementRequest): Promise<string> {
    let modeInstruction = `Enhance the following ${request.sectionType} for a ${request.experienceLevel} ${request.jobRole} role.\nMake it professional, concise, and impact-driven.`;

    if (request.actionType === 'grammar') {
        modeInstruction = `Correct any grammar or spelling mistakes in the following text while preserving the original meaning exactly.`;
    } else if (request.actionType === 'professional') {
        modeInstruction = `Rewrite the following text to sound highly professional, tailored for a formal resume context. Focus on strong action verbs and clarity.`;
    } else if (request.actionType === 'shorten') {
        modeInstruction = `Shorten the following text while retaining all key information and impact.`;
    }

    const prompt = `
    ${modeInstruction}
    
    Original Text:
    ${request.originalText}

    Return only the revised text without any markdown or conversational padding.
  `;

    try {
        const response = await callWithRetry(prompt);
        return response.text();
    } catch (error) {
        console.error("Gemini Enhancement Error details:", error);
        throw new Error("Failed to enhance content");
    }
}

export async function categorizeSkills(skillsText: string) {
  const prompt = `
    You are an expert technical recruiter. Categorize the following skills into a structured JSON with arrays:
    - technical: Core technical skills (e.g. React, Python, AWS)
    - frameworks: Libraries and frameworks (e.g. Next.js, Django, React Native)
    - softSkills: Soft skills (e.g. Leadership, Communication, Agile)
    - languages: Spoken languages (e.g. English, Spanish)
    
    If a category is empty or irrelevant, leave it as an empty array.
    Skills to categorize:
    ${skillsText}
    
    Return ONLY raw JSON with keys: technical, frameworks, softSkills, languages. No markdown formatting.
  `;
  try {
      const response = await callWithRetry(prompt);
      const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
  } catch (error) {
      console.error(error);
      return { technical: [], frameworks: [], softSkills: [], languages: [] };
  }
}

export async function rewriteExperience(role: string, company: string, description: string) {
  const prompt = `
    You are an expert resume writer. Rewrite the following experience description for a ${role} at ${company}.
    Make it highly impactful, using strong action verbs, removing fluff, and focusing on quantified achievements if possible.
    Respond with ONLY the rewritten text, formatted nicely or in bullet points if appropriate (use - for bullets). No introductory text.

    Original Description:
    ${description}
  `;
  try {
      const response = await callWithRetry(prompt);
      return response.text().trim();
  } catch (error) {
      console.error(error);
      return description; // Fallback
  }
}

export async function enhanceProject(name: string, description: string) {
  const prompt = `
    You are an expert resume writer. A candidate is describing a project named "${name}". 
    Rewrite the project description to be professional, compelling, and focused on impact and technical difficulty.
    Provide the response as JSON with two fields:
    - description: The rewritten description.
    - impact: A 1-2 sentence statement of the project's impact, result, or value (e.g. "Increased user retention by 20% by...").

    Return ONLY raw JSON with keys: description, impact. No markdown.
    Original Description:
    ${description}
  `;
  try {
      const response = await callWithRetry(prompt);
      const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
  } catch (error) {
      console.error(error);
      return { description, impact: "" }; // Fallback
  }
}

export async function generateSummary(data: any) {
  const prompt = `
    You are an expert resume writer. Write a professional summary (3-4 sentences max) for the following candidate.
    Make it punchy, impactful, and tailored to their profile (role, skills, and overall experience).
    
    Candidate Data:
    ${JSON.stringify(data)}

    Return ONLY the summary text without any introduction, quotes, or conversational text.
  `;
  try {
      const response = await callWithRetry(prompt);
      return response.text().trim();
  } catch (error: any) {
      console.error("Gemini Edit Error:", error.message);
      return "Unable to generate summary. Please try again.";
  }
}

export async function optimizeCV(text: string, targetRole: string) {
    const prompt = `
      You are an elite executive resume writer. Your task is to take a raw resume text and completely rewrite and structure it into an optimized JSON format for the target role: "${targetRole}".
  
      Optimization goals:
      1. Optimize keywords for the target role.
      2. Write a highly impactful summary.
      3. Order skills logically (most relevant to the role first).
      4. Rewrite experience bullets to be achievement-driven (using numbers/metrics where possible).
  
      Return ONLY raw JSON that strictly matches this exact structure:
      {
        "name": "Full Name",
        "jobTitle": "Target Role Title (or current best tile)",
        "email": "email@example.com",
        "phone": "Phone Number",
        "location": "Location",
        "linkedin": "LinkedIn URL",
        "portfolio": "Portfolio URL",
        "summary": "Impactful professional summary...",
        "experiences": [
          { "id": "1", "title": "Job Title", "company": "Company Name", "period": "Date Range", "description": "Rewritten strong bullet points separated by newlines" }
        ],
        "education": "Degree",
        "educationSchool": "School Name",
        "educationYear": "Year",
        "skills": "Comma separated list of all optimized skills",
        "projects": [
          { "id": "1", "name": "Project Name", "tech": "Tech Stack", "description": "Project Description", "impact": "Impact statement" }
        ],
        "structuredSkills": {
           "technical": ["skill1", "skill2"],
           "frameworks": ["frame1", "frame2"],
           "softSkills": ["soft1"],
           "languages": ["lang1"]
        }
      }
      
      Raw Resume Text:
      ${text.substring(0, 15000)}
    `;
    
    try {
        const response = await callWithRetry(prompt);
        let responseText = response.text();
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Gemini OptimizeCV Error:", error);
        throw new Error("Failed to optimize CV");
    }
}

export async function suggestSkills(jobTitle: string): Promise<string[]> {
    const prompt = `
      You are an expert technical recruiter and resume writer.
      Suggest a list of 10-15 highly relevant professional and technical skills for a candidate applying for the role of "${jobTitle}".
      Make the list diverse, including hard skills, tools/software, and key soft skills relevant to the role.
      
      Return ONLY a JSON array of strings. No markdown formatting, no explanations.
      Example: ["React", "TypeScript", "Agile Methodologies", "Team Leadership"]
    `;
    
    try {
        const response = await callWithRetry(prompt);
        let responseText = response.text();
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Gemini Suggest Skills Error:", error);
        return [];
    }
}

