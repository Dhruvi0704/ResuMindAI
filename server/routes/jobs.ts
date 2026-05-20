import { Router } from "express";
import { JobRecommendation, ExtractedResumeData } from "../../shared/jobTypes.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { callWithRetry } from "../lib/gemini";

export const jobsRouter = Router();

/**
 * Parses resume text using Gemini to extract key parameters for job search
 */
async function extractResumeData(resumeText: string): Promise<ExtractedResumeData> {

    const prompt = `
    Analyze the following resume text and extract the most important information for finding relevant job matches.
    Return ONLY a JSON object with the following structure, and nothing else (no markdown formatting, no explanation):
    {
      "skills": ["skill1", "skill2"], // Extract top 5-10 core skills
      "jobRoles": ["role1", "role2"], // Extract 1-3 most likely target job titles
      "experienceLevel": "Entry Level", // One of: "Entry Level", "Mid Level", "Senior Level", "Executive"
      "industryKeywords": ["keyword1", "keyword2"] // 2-4 broad industry terms (e.g. "Fintech", "Healthcare")
    }

    Resume Text:
    ---
    ${resumeText.substring(0, 5000)}
    ---
  `;

    try {
        const response = await callWithRetry(prompt);
        const text = response.text().trim();

        // Clean up potential markdown formatting
        let cleanText = text;
        if (cleanText.startsWith('\`\`\`json')) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('\`\`\`')) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('\`\`\`')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }

        return JSON.parse(cleanText.trim()) as ExtractedResumeData;
    } catch (error) {
        console.error("Failed to extract data via Gemini, using defaults:", error);
        return {
            skills: ["Software Development", "Communication"],
            jobRoles: ["Software Engineer", "Developer"],
            experienceLevel: "Mid Level",
            industryKeywords: ["Technology"]
        };
    }
}

/**
 * Fetch real-time job openings from the Adzuna API
 */
async function fetchFromAdzuna(extractedData: ExtractedResumeData, query: string, location?: string): Promise<JobRecommendation[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
        console.warn("[Jobs API] Adzuna credentials missing, returning empty jobs list.");
        return [];
    }

    try {
        let whereClause = "";
        if (location && location !== "All India" && location !== "Remote India") {
            whereClause = `&where=${encodeURIComponent(location)}`;
        }

        // Fetch up to 10 results from IN (India)
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=${query}${whereClause}`;
        console.log(`[Jobs API] Fetching from Adzuna...`);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Adzuna API responded with status: ${response.status}`);

        const data = await response.json();
        if (!data.results || !Array.isArray(data.results)) return [];

        return data.results.map((job: any) => {
            const matchScore = 75 + Math.floor(Math.random() * 24);
            const reqSkills = extractedData.skills.filter(s => 
                job.description.toLowerCase().includes(s.toLowerCase())
            );
            if (reqSkills.length === 0) reqSkills.push(extractedData.skills[0] || "Communication");

            return {
                id: job.id.toString(),
                title: job.title.replace(/<\/?[^>]+(>|$)/g, ""),
                company: job.company?.display_name || "Unknown Company",
                location: job.location?.display_name || "Remote",
                platform: "Adzuna",
                description: job.description,
                requiredSkills: reqSkills,
                url: job.redirect_url,
                postedDate: job.created,
                matchScore
            };
        });
    } catch (error) {
        console.error("[Jobs API] Failed to fetch from Adzuna:", error);
        return [];
    }
}

/**
 * Fetch real-time job openings from the JSearch API via RapidAPI
 */
async function fetchFromJSearch(extractedData: ExtractedResumeData, queryStr: string, location?: string): Promise<JobRecommendation[]> {
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
        console.warn("[Jobs API] RapidAPI key missing, returning empty jobs list.");
        return [];
    }

    try {
        console.log(`[Jobs API] Fetching from JSearch...`);
        let locationSuffix = " in India";
        if (location === "Remote India") {
            locationSuffix = " remote in India";
        } else if (location && location !== "All India") {
            locationSuffix = ` in ${location}, India`;
        }
        
        const combinedQuery = encodeURIComponent(`${decodeURIComponent(queryStr)}${locationSuffix}`);
        const url = `https://jsearch.p.rapidapi.com/search?query=${combinedQuery}&page=1&num_pages=1`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        });

        if (!response.ok) throw new Error(`JSearch API responded with status: ${response.status}`);

        const data = await response.json();
        if (!data.data || !Array.isArray(data.data)) return [];

        return data.data.map((job: any) => {
            const matchScore = 75 + Math.floor(Math.random() * 24);
             const jobDesc = job.job_description || "";
            const reqSkills = extractedData.skills.filter(s => 
                jobDesc.toLowerCase().includes(s.toLowerCase())
            );
            if (reqSkills.length === 0) reqSkills.push(extractedData.skills[0] || "Communication");

            return {
                id: job.job_id || `jsearch-${Math.random().toString(36).substr(2, 9)}`,
                title: job.job_title || "Unknown Title",
                company: job.employer_name || "Unknown Company",
                location: `${job.job_city || ''} ${job.job_state || ''}`.trim() || job.job_country || "Remote",
                platform: "JSearch",
                description: jobDesc.substring(0, 500) + (jobDesc.length > 500 ? "..." : ""),
                requiredSkills: reqSkills,
                url: job.job_apply_link || job.job_google_link || "https://google.com/",
                postedDate: job.job_posted_at_datetime_utc || new Date().toISOString(),
                matchScore
            };
        });
    } catch (error) {
        console.error("[Jobs API] Failed to fetch from JSearch:", error);
        return [];
    }
}

/**
 * Fetch real-time job openings from the Jooble API
 */
async function fetchFromJooble(extractedData: ExtractedResumeData, queryStr: string, location?: string): Promise<JobRecommendation[]> {
    const joobleApiKey = process.env.JOOBLE_API_KEY;

    if (!joobleApiKey) {
        console.warn("[Jobs API] Jooble API key missing, returning empty jobs list.");
        return [];
    }

    try {
        console.log(`[Jobs API] Fetching from Jooble...`);
        const url = `https://jooble.org/api/${joobleApiKey}`;
        
        // Jooble expects a specific JSON payload
        const payload = {
            keywords: decodeURIComponent(queryStr),
            location: location && location !== "All India" && location !== "Remote India" ? location : "India"
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Jooble API responded with status: ${response.status}`);

        const data = await response.json();
        // The results are found in the `jobs` array
        if (!data.jobs || !Array.isArray(data.jobs)) return [];

        return data.jobs.map((job: any) => {
            const matchScore = 75 + Math.floor(Math.random() * 24);
             const jobDesc = job.snippet || "";
            const reqSkills = extractedData.skills.filter(s => 
                jobDesc.toLowerCase().includes(s.toLowerCase())
            );
            if (reqSkills.length === 0) reqSkills.push(extractedData.skills[0] || "Communication");

            return {
                id: job.id?.toString() || `jooble-${Math.random().toString(36).substr(2, 9)}`,
                title: job.title ? job.title.replace(/<\/?[^>]+(>|$)/g, "") : "Unknown Title",
                company: job.company || "Unknown Company",
                location: job.location || "Remote",
                platform: "Jooble",
                description: jobDesc.replace(/<\/?[^>]+(>|$)/g, ""),
                requiredSkills: reqSkills,
                url: job.link || "https://jooble.org/",
                postedDate: job.updated || new Date().toISOString(),
                matchScore
            };
        });
    } catch (error) {
        console.error("[Jobs API] Failed to fetch from Jooble:", error);
        return [];
    }
}

/**
 * Fetch real-time job openings from multiple platforms concurrently
 */
async function fetchJobsFromPlatforms(extractedData: ExtractedResumeData, location?: string): Promise<JobRecommendation[]> {
    const mainRole = extractedData.jobRoles.length > 0 ? extractedData.jobRoles[0] : "Software Engineer";
    const topSkills = extractedData.skills.slice(0, 2).join(' ');
    // Search constraints are applied appropriately downstream based on the location param
    const query = encodeURIComponent(`${mainRole} ${topSkills}`);

    // Call Adzuna, JSearch, and Jooble concurrently
    const [adzunaResults, jsearchResults, joobleResults] = await Promise.all([
        fetchFromAdzuna(extractedData, query, location),
        fetchFromJSearch(extractedData, query, location),
        fetchFromJooble(extractedData, query, location)
    ]);

    // Combine the results
    const combinedJobs = [...adzunaResults, ...jsearchResults, ...joobleResults];

    // Optional: shuffle or deduplicate here. For now, sort strictly by simulated matchScore
    return combinedJobs.sort((a, b) => b.matchScore - a.matchScore);
}

jobsRouter.post("/recommendations", async (req, res) => {
    try {
        const { resumeText, location } = req.body;

        if (!resumeText) {
            return res.status(400).json({ message: "resumeText is required" });
        }

        console.log(`[Jobs API] Generating recommendations for resume length ${resumeText.length}`);

        // 1. Extract context from resume
        const extractedData = await extractResumeData(resumeText);
        console.log("[Jobs API] Extracted Profile:", JSON.stringify(extractedData));

        // 2. Fetch from platforms dynamically utilizing the location payload
        const rawJobs = await fetchJobsFromPlatforms(extractedData, location);

        // 3. Optional: Additional ranking or filtering could go here

        res.json({
            extractedProfile: extractedData,
            recommendations: rawJobs
        });

    } catch (error: any) {
        console.error("[Jobs API] Error generating recommendations:", error);
        res.status(500).json({ message: error.message || "Failed to generate job recommendations" });
    }
});
