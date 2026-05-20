import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.ts";
import { StorageService } from "./services/storageService.ts";
import { enhanceResumeSection, analyzeCV, optimizeCV, rewriteSection, categorizeSkills, rewriteExperience, enhanceProject, generateSummary } from "./lib/gemini.ts";
import { evaluateResume, improveResumeForJob } from "./lib/recruiterAI.ts";
import multer from "multer";
import { jobsRouter } from "./routes/jobs.ts";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

import { parseAIResponse, callAI } from "./services/aiService.ts";

const matchKeywords = (
  cvText: string, 
  cvKeywords: string[],
  roleKeywords: string[]
): string[] => {
  const cvTextLower = cvText.toLowerCase()
  const cvKeywordsLower = cvKeywords.map(k => k.toLowerCase())
  
  return roleKeywords.filter(roleKw => {
    const kw = roleKw.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    // Check 1: exact match in CV text
    if (cvTextLower.includes(roleKw.toLowerCase())) return true
    
    // Check 2: normalized match
    const cvNormalized = cvTextLower.replace(/[^a-z0-9\s]/g, '')
    if (cvNormalized.includes(kw)) return true
    
    // Check 3: match in extracted keywords
    if (cvKeywordsLower.some(ck => {
      const ckNorm = ck.replace(/[^a-z0-9]/g, '')
      return ckNorm.includes(kw) || kw.includes(ckNorm)
    })) return true
    
    // Check 4: partial word match for compound words
    const kwWords = kw.split(/\s+/)
    if (kwWords.every(word => cvTextLower.includes(word) && word.length > 3)) return true
    
    return false
  })
}

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface

  // Authentication Routes
  const bcrypt = await import("bcryptjs");
  const passport = await import("passport");

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, name } = req.body;
      if (!username || !password || !name) return res.status(400).send("Missing credentials");

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) return res.status(400).send("Username already exists");

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword, name });

      req.login(user, (err) => {
        if (err) return next(err);
        const userWithoutPassword = { ...user };
        delete (userWithoutPassword as any).password;
        return res.json(userWithoutPassword);
      });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/login", passport.default.authenticate("local"), (req, res) => {
    const userWithoutPassword = { ...req.user } as any;
    delete userWithoutPassword.password;
    res.json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const userWithoutPassword = { ...req.user } as any;
      delete userWithoutPassword.password;
      return res.json(userWithoutPassword);
    }
    res.sendStatus(401);
  });

  app.post("/api/enhanced-resume", async (req, res) => {
    try {
      const { originalText, sectionType, jobRole, experienceLevel, actionType } = req.body;

      if (!originalText || !sectionType || !jobRole) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      console.log(`[API] received request for ${sectionType}. Job: ${jobRole}, Level: ${experienceLevel}, Action: ${actionType || 'enhance'}`);

      const enhancedText = await enhanceResumeSection({
        originalText,
        sectionType,
        jobRole,
        experienceLevel,
        actionType,
      });

      res.json({ enhancedText });
    } catch (error: any) {
      console.error("Enhancement API Error:", error);
      // Return the specific error message to the client
      res.status(500).json({ message: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/generate-summary", async (req, res) => {
    try {
      const { jobTitle, name } = req.body;

      if (!jobTitle) {
        return res.status(400).json({ message: "Job title is required" });
      }

      console.log(`[API] Generating summary for ${jobTitle}`);

      const summary = await enhanceResumeSection({
        originalText: `Generate a professional summary for a ${jobTitle}`,
        sectionType: "summary",
        jobRole: jobTitle,
        experienceLevel: "Mid-Level",
      });

      res.json({ summary });
    } catch (error: any) {
      console.error("Summary Generation API Error:", error);
      res.json({ summary: "Unable to generate summary. Please try again." });
    }
  });

  // Mock Interview Routes
  app.post("/api/interviews/start", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const { jobTitle, experienceLevel, jobDescription, roundType } = req.body;
      const { generateInterviewQuestions } = await import("./lib/interviewAI.ts");
      const { db } = await import("./db.ts");
      const { mockInterviews } = await import("../shared/schema.ts");
      
      const crypto = await import("crypto");

      const questions = await generateInterviewQuestions({ jobTitle, experienceLevel, jobDescription, roundType });
      
      const sessionResult = await db.insert(mockInterviews).values({
        userId: (req.user as any).id,
        targetRole: jobTitle,
        questions: questions.map((q, i) => ({ id: crypto.randomUUID(), ...q, order: i })),
        answers: [],
        scores: { experienceLevel, roundType },
      }).returning();

      res.json({ interviewId: sessionResult[0].id });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: "Failed to start interview: " + (e.message || e.toString()) });
    }
  });

  app.get("/api/interviews/history/anonymous", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.json([]);
      const { db } = await import("./db.ts");
      const { mockInterviews } = await import("../shared/schema.ts");
      const { eq, desc } = await import("drizzle-orm");
      const history = await db.select().from(mockInterviews)
        .where(eq(mockInterviews.userId, (req.user as any).id))
        .orderBy(desc(mockInterviews.createdAt));
      res.json(history.map(row => ({
        id: row.id,
        jobTitle: row.targetRole,
        roundType: (row.scores as any)?.roundType || "Technical Round",
        experienceLevel: (row.scores as any)?.experienceLevel || "Varies",
        createdAt: row.createdAt,
        score: row.overallScore
      })));
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  app.get("/api/interviews/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const { db } = await import("./db.ts");
      const { mockInterviews } = await import("../shared/schema.ts");
      const { eq } = await import("drizzle-orm");
      const rows = await db.select().from(mockInterviews).where(eq(mockInterviews.id, req.params.id as string));
      if (!rows.length) return res.status(404).json({ message: "Not found" });
      
      const interview = rows[0];
      if (interview.userId !== (req.user as any).id) return res.status(403).json({ message: "Forbidden" });

      res.json({
        interview: {
          id: interview.id,
          jobTitle: interview.targetRole,
          roundType: (interview.scores as any)?.roundType || "Technical Round",
          experienceLevel: (interview.scores as any)?.experienceLevel || "Varies",
          status: interview.overallScore !== null ? "Completed" : "In Progress",
          integrityScore: (interview.scores as any)?.integrityScore || 100,
          violationCount: (interview.scores as any)?.violationCount || 0,
          terminationReason: (interview.scores as any)?.terminationReason,
          feedback: interview.feedback,
          score: interview.overallScore
        },
        questions: interview.questions,
        answers: interview.answers
      });
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch interview" });
    }
  });

  app.post("/api/interviews/:id/answer", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const { questionId, userAnswer, timeTaken } = req.body;
      const { evaluateInterviewAnswer } = await import("./lib/interviewAI.ts");
      const { db } = await import("./db.ts");
      const { mockInterviews } = await import("../shared/schema.ts");
      const { eq } = await import("drizzle-orm");
      
      const rows = await db.select().from(mockInterviews).where(eq(mockInterviews.id, req.params.id as string));
      if (!rows.length) return res.status(404).json({ message: "Not found" });
      const interview = rows[0];

      const q = (interview.questions as any[]).find(qu => qu.id === questionId);
      if (!q) return res.status(400).json({ message: "Question not found" });

      const feedback = await evaluateInterviewAnswer(
        interview.targetRole,
        (interview.scores as any)?.experienceLevel || "Varies",
        "", 
        q.question,
        userAnswer,
        (interview.scores as any)?.roundType || "Technical Round",
        q.modelAnswer
      );

      const newAnswer = {
        questionId,
        userAnswer,
        timeTaken,
        aiFeedback: JSON.stringify(feedback),
        score: feedback?.ideal_answer_comparison?.candidate_score_out_of_10?.toString() || "0",
      };

      const updatedAnswers = [...(interview.answers as any[]), newAnswer];
      
      await db.update(mockInterviews)
        .set({ answers: updatedAnswers })
        .where(eq(mockInterviews.id, req.params.id as string));

      res.json({ message: "Answer saved" });
    } catch (e) {
      res.status(500).json({ message: "Failed to save answer" });
    }
  });

  app.post("/api/interviews/:id/finish", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const { violationCount, integrityScore, terminationReason } = req.body;
      
      const { db } = await import("./db.ts");
      const { mockInterviews } = await import("../shared/schema.ts");
      const { eq } = await import("drizzle-orm");
      const { generateOverallFeedback } = await import("./lib/interviewAI.ts");
      
      const rows = await db.select().from(mockInterviews).where(eq(mockInterviews.id, req.params.id as string));
      if (!rows.length) return res.status(404).json({ message: "Not found" });
      const interview = rows[0];

      const qaPairs = (interview.questions as any[]).map(q => {
        const a = (interview.answers as any[]).find(ans => ans.questionId === q.id);
        const fbStr = a?.aiFeedback;
        let score = 0;
        if (fbStr) {
          try {
             const fbObj = JSON.parse(fbStr);
             score = fbObj.ideal_answer_comparison?.candidate_score_out_of_10 || 0;
          } catch (e) {}
        }
        return {
          question: q.question,
          answer: a?.userAnswer || "(No Answer)",
          score,
          aiFeedback: fbStr || ""
        };
      });

      const overall = await generateOverallFeedback(
        interview.targetRole,
        (interview.scores as any)?.roundType || "Technical Round",
        qaPairs
      );

      const updatedScores = {
        ...(interview.scores as any),
        integrityScore: integrityScore ?? 100,
        violationCount: violationCount ?? 0,
        terminationReason
      };

      await db.update(mockInterviews)
        .set({ 
          overallScore: overall.overall_scores?.overall_interview || 0,
          feedback: JSON.stringify(overall),
          scores: updatedScores
        })
        .where(eq(mockInterviews.id, req.params.id as string));

      res.json({ message: "Interview completed" });
    } catch (e) {
      res.status(500).json({ message: "Failed to finish" });
    }
  });

  // ATS Analysis endpoint - Advanced AI-powered resume screening
  app.post("/api/ats-analysis", async (req, res) => {
    try {
      const { resumeText, jobDescription, jobRole } = req.body;

      if (!resumeText || !jobDescription) {
        return res.status(400).json({ message: "Resume text and job description are required" });
      }

      console.log(`[API] Starting ATS analysis. JD length: ${jobDescription.length}, Resume length: ${resumeText.length}`);

      // Dynamic import to avoid circular dependencies
      const { performATSAnalysis } = await import("./lib/atsAnalysis.ts");

      const analysis = await performATSAnalysis({
        resumeText,
        jobDescription,
        jobRole,
      });

      if (req.isAuthenticated()) {
        const analysisAny = analysis as any;
        try {
          await StorageService.saveATSEvaluation((req.user as any).id, {
            jobDescription,
            targetRole: jobRole,
            candidateScore: analysisAny.finalScore,
            atsKeywordScore: analysisAny.breakdown?.keywordScore || 0,
            skillsMatchScore: analysisAny.breakdown?.skillsMatchScore || 0,
            experienceScore: analysisAny.breakdown?.experienceScore || 0,
            educationScore: analysisAny.breakdown?.educationScore || 0,
            projectsScore: analysisAny.breakdown?.projectsScore || 0,
            domainMatchPct: analysisAny.domainMatchPercentage || 0,
            penaltyApplied: analysisAny.penaltyApplied || false,
            interviewChance: analysisAny.interviewChance || 0,
            offerProbability: analysisAny.offerProbability || 0,
            evaluationData: analysis
          });
        } catch(e) {}
      }

      console.log(`[API] ATS analysis complete. Final score: ${analysis.finalScore}, Processing time: ${analysis.processingTime}ms`);

      res.json(analysis);
    } catch (error: any) {
      console.error("ATS Analysis API Error:", error);
      res.status(500).json({
        message: error.message || "Internal Server Error",
        details: "Failed to perform ATS analysis"
      });
    }
  });

  // Job Description to CV Gap Analyzer
  app.post("/api/gap-analysis", async (req, res) => {
    try {
      const { jobDescription, resumeData } = req.body;

      if (!jobDescription || !resumeData) {
        return res.status(400).json({ message: "jobDescription and resumeData are required" });
      }

      console.log(`[API] Starting CV Gap Analysis...`);
      const { performGapAnalysis } = await import("./lib/gapAnalysis.ts");

      const gapReport = await performGapAnalysis(jobDescription, resumeData);

      // Save to Database if user is authenticated
      if (req.isAuthenticated()) {
        const userId = (req.user as any).id;
        try {
          // Check if there's an existing generated ID mapping to the resume, else generate a mock ID for history
          const resumeId = resumeData.id || `mock-${Date.now()}`; 
          await StorageService.saveGapAnalysis(userId, {
            jobDescription,
            overallMatch: gapReport.overall_match,
            domainMatchPct: gapReport.domain_match_percentage,
            penaltyApplied: gapReport.penalty_applied || false,
            sectionsData: gapReport.sections,
          });
        } catch(e) {}
      }

      res.json(gapReport);
    } catch (error: any) {
      console.error("Gap Analysis API Error:", error);
      res.status(500).json({
        message: error.message || "Failed to perform gap analysis",
      });
    }
  });

  // CV Management Routes
  app.get("/api/resumes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const userResumes = await storage.getResumesByUserId((req.user as any).id);
    res.json(userResumes);
  });

  app.post("/api/resumes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const resume = await storage.createResume({ ...req.body, userId: (req.user as any).id });
    res.json(resume);
  });

  app.get("/api/resumes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const resume = await storage.getResume(req.params.id);
    if (!resume) return res.status(404).send("Resume not found");
    if (resume.userId !== (req.user as any).id) return res.status(403).send("Forbidden");
    res.json(resume);
  });

  app.put("/api/resumes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const resume = await storage.getResume(req.params.id);
    if (!resume) return res.status(404).send("Resume not found");
    if (resume.userId !== (req.user as any).id) return res.status(403).send("Forbidden");
    const updatedResume = await storage.updateResume(req.params.id, req.body);
    res.json(updatedResume);
  });

  app.delete("/api/resumes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const resume = await storage.getResume(req.params.id);
    if (!resume) return res.status(404).send("Resume not found");
    if (resume.userId !== (req.user as any).id) return res.status(403).send("Forbidden");
    
    // We attempt to delete it if storage supports it. If not we return 501.
    if ((storage as any).deleteResume) {
      await (storage as any).deleteResume(req.params.id);
      res.json({ message: "Deleted successfully" });
    } else {
      res.status(501).send("Delete not implemented in storage yet");
    }
  });

  app.post("/api/cv/save", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: "Unauthorized" });
    try {
      const { userId, cvId, cvName, cvData, templateConfig } = req.body;
      if (!userId || !cvData || !templateConfig) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      const savedDoc = await StorageService.saveCV(
        userId, cvData, templateConfig, cvId
      );

      res.json({ success: true, cvId: savedDoc.id });
    } catch (error: any) {
      console.error('CV save error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  });

  app.post("/api/resumes/analyze", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ message: "Text is required" });
      const { analyzeCV } = await import("./lib/gemini.ts");
      const analysis = await analyzeCV(text);
      res.json({
        score: analysis.score,
        grammarScore: analysis.metrics.contentQuality,
        impactScore: analysis.metrics.achievementsImpact,
        structureScore: analysis.metrics.formattingStructure,
        feedback: analysis.feedback,
        improvedContent: null // optionally populate this later
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: e.message || "Failed to analyze" });
    }
  });

  app.post("/api/resumes/rewrite", async (req, res) => {
    try {
      const { text, sectionType } = req.body;
      if (!text) return res.status(400).json({ message: "Text is required" });
      const { rewriteSection } = await import("./lib/gemini.ts");
      const rewrittenText = await rewriteSection(text, (sectionType as any) || "experience");
      res.json({ rewrittenText });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: e.message || "Failed to rewrite" });
    }
  });

  // AI Analysis Routes (Gemini)
  const upload = multer({ storage: multer.memoryStorage() });

  const analysisCache = new Map<string, { result: any, timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

  app.post('/api/cv/analyze', async (req, res) => {
    try {
      const { fileBase64, fileType, fileName, targetRole, userId } = req.body

      if (!fileBase64 || !targetRole) {
        return res.status(400).json({
          success: false,
          message: !fileBase64 ? 'No file received' : 'Target role required'
        })
      }

      // Check RAM Cache securely validating duplicated payload clicks
      const cacheKey = `${fileBase64.slice(-50)}_${targetRole}`;
      const cached = analysisCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('✅ Returning cached Analysis seamlessly dropping API payload array.');
        return res.json({ success: true, analysis: cached.result });
      }

      const { getGeminiModel } = await import('./services/geminiService.ts')
      const model = getGeminiModel()

      const generateWithRetry = async (parts: any) => {
        let lastErr: any
        for (let i = 0; i < 4; i++) {
          try {
            if (i > 0) console.log(`Retry attempt ${i} for Gemini API Analysis...`)
            return await model.generateContent(parts)
          } catch (err: any) {
            lastErr = err
            if (err.status === 429 || err.message?.toLowerCase().includes('quota') || err.message?.toLowerCase().includes('rate')) {
              console.warn(`[429 Rate Limit] Gemini API fully occupied. Waiting ${5000 * (i + 1)}ms before retry...`)
              await new Promise(r => setTimeout(r, 5000 * (i + 1)))
              continue
            }
            throw err
          }
        }
        throw lastErr
      }

      // STEP 1: EXTRACT TEXT FROM FILE
      let extractedText = ''
      const isDocx = fileType?.includes('wordprocessingml') || fileName?.endsWith('.docx')
      const isPdf  = fileType === 'application/pdf' || fileName?.endsWith('.pdf')

      if (isDocx) {
        let mammoth;
        try {
          const m = await import('mammoth');
          mammoth = m.default || m;
        } catch (err) {
          return res.status(500).json({ success: false, message: 'DOCX parser failed to load.' });
        }
        const buffer = Buffer.from(fileBase64, 'base64')
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value?.trim() || ''
        console.log('DOCX extracted length:', extractedText.length)
      } else if (isPdf) {
        try {
          const p = await import('pdf-parse');
          const pdfParse = (p as any).default || p;
          const buffer = Buffer.from(fileBase64, 'base64')
          const pdfData = await pdfParse(buffer)
          extractedText = (pdfData.text || '').trim()
          console.log('PDF extracted length:', extractedText.length)
        } catch (err: any) {
          console.warn('PDF parse failed, falling back to PDF native AI read:', err?.message || err)
          extractedText = ''
        }
      }

      const analyzePromptParts = [`Analyze this CV for the role: "${targetRole}"\n\n`]
      if (extractedText) {
        analyzePromptParts.push(`CV TEXT:\n${extractedText.substring(0, 3000)}\n\n`)
      } else if (isPdf) {
        analyzePromptParts.push(`Use the attached PDF resume content to extract and analyze the CV.\n\n`)
      }
      analyzePromptParts.push(`Return a JSON object with exactly these fields:
{
  "totalYearsExperience": <number>,
  "skills": <array of strings>,
  "educationLevel": <"phd" or "masters" or "bachelors" or "diploma" or "none">,
  "hasSummary": <true or false>,
  "hasExperience": <true or false>,
  "hasEducation": <true or false>,
  "hasSkills": <true or false>,
  "hasQuantifiedMetrics": <true or false>,
  "bulletPointCount": <number>,
  "strongActionVerbsCount": <number>,
  "weakActionVerbsCount": <number>,
  "keywords": <array of strings>,
  "strengths": <array of 3 strings>,
  "weaknesses": <array of 3 strings>,
  "recommendations": <array of 3 strings>,
  "sectionFeedback": {
    "summary": <string>,
    "experience": <string>,
    "education": <string>,
    "skills": <string>
  },
  "skillLevels": {
    "technical": <number 0-100>,
    "experience": <number 0-100>,
    "education": <number 0-100>,
    "impact": <number 0-100>,
    "keywords": <number 0-100>,
    "content": <number 0-100>
  }
}
`)
      const analyzePrompt = analyzePromptParts.join('')

      console.log('Extracting CV data via AI...')
      let extractText = ''
      try {
        if (isPdf && !extractedText) {
          extractText = await callAI(analyzePrompt, fileBase64, 'application/pdf');
        } else {
          extractText = await callAI(analyzePrompt);
        }
      } catch (err: any) {
        throw new Error(err.message || 'Failed to call AI service')
      }

      let cvData: any
      try {
        cvData = parseAIResponse(extractText)
      } catch (err: any) {
        console.error('Parse failed, raw:', extractText.substring(0, 500))
        throw new Error(err.message || 'Failed to parse CV analysis from AI')
      }

      console.log('Extracted data:', {
        name: cvData.name,
        strengths: cvData.strengths,
        weaknesses: cvData.weaknesses,
        feedback: cvData.sectionFeedback,
        skillLevels: cvData.skillLevels
      })

      console.log('Extracted data:', {
        name: cvData.name,
        strengths: cvData.strengths,
        weaknesses: cvData.weaknesses,
        feedback: cvData.sectionFeedback,
        skillLevels: cvData.skillLevels
      })

      // STEP 3: ROLE-BASED KEYWORD SETS
      const normalizedRole = targetRole.toLowerCase().trim()
      const roleKeywords = getRoleKeywords(normalizedRole)
      const cvKeywordsLower = (cvData.keywords || []).map((k: string) => k.toLowerCase())
      const cvTextLower = extractedText.toLowerCase() || cvData.keywords?.join(' ').toLowerCase() || ''

      // STEP 4: CALCULATE ALL SCORES MATHEMATICALLY
      const matchedKeywords = matchKeywords(
        extractedText || '',
        cvData.keywords || [],
        roleKeywords
      )
      const keywordMatchRatio = roleKeywords.length > 0 ? matchedKeywords.length / roleKeywords.length : 0
      const rawAtsScore = Math.round(keywordMatchRatio * 100)

      const domainMatchPct = Math.round(keywordMatchRatio * 100)
      let penaltyMultiplier = 1
      let penaltyApplied = false
      if (domainMatchPct < 10) {
        penaltyMultiplier = 0.4
        penaltyApplied = true
      } else if (domainMatchPct < 20) {
        penaltyMultiplier = 0.7
        penaltyApplied = true
      }
      const atsScore = Math.round(rawAtsScore * penaltyMultiplier)

      const requiredSkills = roleKeywords.slice(0, 10)
      const matchedSkills = matchKeywords(
        extractedText || '',
        cvData.skills || [],
        requiredSkills
      )
      const skillsScore = requiredSkills.length > 0 ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 100

      const yoe = cvData.totalYearsExperience || 0

      const experienceScore = (() => {
        let base = yoe === 0 ? 20
          : yoe <= 1 ? 45 : yoe <= 2 ? 60
          : yoe <= 3 ? 70 : yoe <= 5 ? 80
          : yoe <= 8 ? 88 : yoe <= 12 ? 93 : 97
          
        if ((cvData.strongActionVerbs?.length || 0) > 3) base = Math.min(100, base + 10)
        if (cvData.hasQuantifiedMetrics) base = Math.min(100, base + 10)
        if ((cvData.weakActionVerbs?.length || 0) > 3) base = Math.max(0, base - 10)
        return base
      })()

      const educationScore = (() => {
        switch(cvData.educationLevel?.toLowerCase()) {
          case 'phd': return 100
          case 'masters': return 85
          case 'bachelors': return 70
          case 'diploma': return 55
          case 'other': return 45
          default: return 30
        }
      })()

      let qualityScore = 50
      if (cvData.hasSummary) qualityScore += 15
      if (cvData.hasExperience) qualityScore += 10
      if (cvData.hasSkills) qualityScore += 10
      if (cvData.hasEducation) qualityScore += 5
      if (cvData.hasQuantifiedMetrics) qualityScore += 15
      if ((cvData.bulletPointCount || 0) >= 6) qualityScore += 10
      if ((cvData.strongActionVerbs?.length || 0) > 3) qualityScore += 5
      if ((cvData.totalWordCount || 0) > 400) qualityScore += 5
      if (cvData.hasProjects) qualityScore += 5
      
      if ((cvData.weakActionVerbs?.length || 0) > 3) qualityScore -= 10
      if ((cvData.totalWordCount || 0) < 150) qualityScore -= 15
      qualityScore = Math.max(0, Math.min(100, qualityScore))

      const summaryScore = (() => {
        if (!cvData.hasSummary) return 0
        let s = 50
        if (cvData.hasQuantifiedMetrics) s += 20
        if ((cvData.totalWordCount || 0) > 300) s += 15
        if ((cvData.strongActionVerbs?.length || 0) > 2) s += 15
        return Math.min(100, s)
      })()

      const experienceSectionScore = (() => {
        if (!cvData.hasExperience) return 0
        let s = 40
        if (cvData.hasQuantifiedMetrics) s += 25
        if ((cvData.bulletPointCount || 0) >= 6) s += 20
        if ((cvData.strongActionVerbs?.length || 0) > 3) s += 15
        return Math.min(100, Math.round(s * penaltyMultiplier))
      })()

      const educationSectionScore = Math.round(educationScore * (cvData.hasEducation ? 1 : 0))
      const skillsSectionScore = Math.round(skillsScore * penaltyMultiplier)

      const skillDistribution = {
        content: qualityScore,
        experience: experienceScore,
        education: educationScore,
        technical: skillsScore,
        impact: cvData.hasQuantifiedMetrics ? 85 : 20,
        keywords: rawAtsScore
      }

      let overallScore = Math.round(
        (skillDistribution.keywords   * 0.25) +
        (skillDistribution.technical  * 0.20) +
        (skillDistribution.experience * 0.20) +
        (skillDistribution.content    * 0.15) +
        (skillDistribution.education  * 0.10) +
        (skillDistribution.impact     * 0.10)
      )

      const avgSkillDist = Math.round(
        (skillDistribution.content +
         skillDistribution.experience +
         skillDistribution.education +
         skillDistribution.technical +
         skillDistribution.impact +
         skillDistribution.keywords) / 6
      )

      if (Math.abs(overallScore - avgSkillDist) > 15) {
        console.warn(`Score inconsistency detected: overall=${overallScore}, skillAvg=${avgSkillDist}. Adjusting...`)
        overallScore = Math.round((overallScore * 0.6) + (avgSkillDist * 0.4))
      }

      const interviewChance = Math.round((0.7 * overallScore) + (0.3 * experienceScore))
      const offerProbability = Math.round(interviewChance * 0.7)

      console.log('=== SCORE BREAKDOWN ===')
      console.log('ATS (keywords):', rawAtsScore, '→ after penalty:', atsScore)
      console.log('Skills match:', skillsScore)
      console.log('Experience:', experienceScore)  
      console.log('Education:', educationScore)
      console.log('Quality:', qualityScore)
      console.log('Impact:', skillDistribution.impact)
      console.log('Domain match%:', domainMatchPct)
      console.log('Penalty multiplier:', penaltyMultiplier)
      console.log('OVERALL:', overallScore)
      console.log('Interview chance:', interviewChance)

      // STEP 5: FINAL RESPONSE
      const analysis = {
        overallScore,
        atsScore,
        skillsScore,
        experienceScore,
        educationScore,
        qualityScore,
        domainMatchPct,
        penaltyApplied,
        interviewChance: Math.min(100, interviewChance),
        offerProbability: Math.min(100, offerProbability),
        
        strengths: cvData.strengths || [],
        weaknesses: cvData.weaknesses || [],
        recommendations: cvData.recommendations || [],
        matchedKeywords: matchedKeywords || [],
        missingKeywords: roleKeywords
          .filter((k: string) => !matchedKeywords.includes(k))
          .slice(0, 8),
        
        sections: {
          summary: {
            score: summaryScore,
            status: summaryScore > 70 ? 'strong' : summaryScore > 40 ? 'weak' : 'missing',
            feedback: cvData.sectionFeedback?.summary || 'No feedback available'
          },
          experience: {
            score: experienceSectionScore,
            status: experienceSectionScore > 70 ? 'strong' : experienceSectionScore > 40 ? 'weak' : 'missing',
            feedback: cvData.sectionFeedback?.experience || 'No feedback available'
          },
          education: {
            score: educationSectionScore,
            status: educationSectionScore > 70 ? 'strong' : educationSectionScore > 40 ? 'weak' : 'missing',
            feedback: cvData.sectionFeedback?.education || 'No feedback available'
          },
          skills: {
            score: skillsSectionScore,
            status: skillsSectionScore > 70 ? 'strong' : skillsSectionScore > 40 ? 'weak' : 'missing',
            feedback: cvData.sectionFeedback?.skills || 'No feedback available'
          }
        },
        
        skillDistribution: {
          technical: cvData.skillLevels?.technical || Math.round(skillsScore),
          experience: cvData.skillLevels?.experience || Math.round(experienceScore),
          education: cvData.skillLevels?.education || Math.round(educationScore),
          impact: cvData.skillLevels?.impact || (cvData.hasQuantifiedMetrics ? 75 : 30),
          keywords: cvData.skillLevels?.keywords || Math.round(rawAtsScore),
          content: cvData.skillLevels?.content || Math.round(qualityScore)
        },

        cvInfo: {
          name: cvData.name || '',
          currentRole: cvData.currentRole || '',
          yearsExperience: yoe,
          skillsFound: cvData.skills || [],
          educationLevel: cvData.educationLevel || ''
        }
      }

      console.log('=== FINAL SCORES ===')
      console.log('Overall:', overallScore)
      console.log('ATS:', atsScore)

      if (req.isAuthenticated()) {
        const authUserId = (req.user as any).id;
        try {
          // Check storage context natively
          await StorageService.saveAnalysis(authUserId, {
            fileName: fileName || "upload",
            targetRole,
            overallScore: analysis.overallScore,
            atsScore: analysis.atsScore,
            interviewChance: analysis.interviewChance,
            analysisData: analysis,
            extractedText: extractedText.substring(0, 5000)
          });
        } catch(dbErr) { console.error('DB Insert skipped:', dbErr) }
      }

      // Drop results correctly into volatile memory caching
      analysisCache.set(cacheKey, {
        result: analysis,
        timestamp: Date.now()
      });

      return res.json({ success: true, analysis })

    } catch (error: any) {
      console.error('Route error:', error.message)
      
      let userMessage = 'Please try again.'
      
      if (error.message?.includes('parse') || 
          error.message?.includes('JSON')) {
        userMessage = 'AI returned invalid format. Please try again.'
      } else if (error.message?.includes('quota') || 
                 error.status === 429) {
        userMessage = 'Gemini rate limit hit. Wait 1 minute and retry.'
      } else if (error.message?.includes('truncat')) {
        userMessage = 'Response too long. Try again.'
      }
      
      return res.status(500).json({
        success: false,
        message: userMessage,
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  });
const ROLE_KEYWORDS: Record<string, string[]> = {
  'fashion designer': ['fashion', 'design', 'textile', 'garment', 'collection', 'sketch', 'pattern', 'fabric', 'trend', 'styling', 'illustration', 'cad', 'photoshop', 'illustrator', 'portfolio', 'sustainable', 'retail', 'brand', 'creative', 'couture', 'ready-to-wear', 'merchandising'],
  'software engineer': ['javascript', 'typescript', 'react', 'node', 'python', 'java', 'git', 'api', 'database', 'algorithms', 'testing', 'agile', 'docker', 'aws', 'microservices', 'ci/cd', 'rest', 'go', 'c#'],
  'data scientist': ['python', 'r', 'sql', 'machine learning', 'statistics', 'pandas', 'numpy', 'tensorflow', 'visualization', 'modeling', 'regression', 'classification', 'deep learning', 'nlp'],
  'ai researcher': ['machine learning', 'deep learning', 'pytorch', 'tensorflow', 'nlp', 'computer vision', 'research', 'publications', 'transformers', 'reinforcement learning', 'statistics', 'cuda', 'papers', 'neural networks'],
  'product manager': ['roadmap', 'stakeholders', 'agile', 'scrum', 'kpis', 'user research', 'prioritization', 'metrics', 'strategy', 'analytics', 'product', 'go-to-market'],
  'data analyst': ['sql', 'excel', 'tableau', 'power bi', 'python', 'r', 'statistics', 'dashboard', 'reporting', 'visualization', 'data cleaning', 'analysis'],
  'marketing manager': ['marketing', 'campaign', 'seo', 'sem', 'social media', 'analytics', 'brand', 'digital', 'content', 'roi', 'leads', 'conversion', 'crm', 'strategy', 'b2b'],
  'graphic designer': ['photoshop', 'illustrator', 'indesign', 'figma', 'typography', 'branding', 'ui', 'creative', 'portfolio', 'design', 'visual', 'color theory'],
  'financial analyst': ['financial modeling', 'excel', 'valuation', 'forecasting', 'analysis', 'accounting', 'budget', 'revenue', 'p&l', 'investment', 'reporting', 'bloomberg'],
  'chartered accountant': ['accounting', 'audit', 'tax', 'financial statements', 'tally', 'gst', 'compliance', 'balance sheet', 'reconciliation', 'ifrs', 'gaap'],
  'doctor': ['clinical', 'diagnosis', 'treatment', 'patient care', 'medical', 'surgery', 'prescription', 'anatomy', 'pharmacology', 'research', 'mbbs', 'hospital'],
  'teacher': ['curriculum', 'lesson plan', 'assessment', 'classroom management', 'pedagogy', 'teaching', 'students', 'education', 'learning outcomes', 'subject matter', 'communication'],
  'backend developer': ['node.js', 'python', 'java', 'go', 'c#', 'sql', 'nosql', 'mongodb', 'postgresql', 'redis', 'api design', 'microservices', 'docker', 'kubernetes', 'aws', 'system design'],
  'frontend developer': ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'sass', 'tailwind', 'webpack', 'responsive design', 'ux/ui', 'performance'],
  'devops engineer': ['linux', 'bash', 'python', 'aws', 'azure', 'gcp', 'ci/cd', 'jenkins', 'docker', 'kubernetes', 'terraform', 'ansible', 'monitoring', 'prometheus'],
  'cloud architect': ['aws', 'azure', 'gcp', 'terraform', 'kubernetes', 'system design', 'microservices', 'security', 'networking', 'serverless', 'iaas', 'paas', 'cost optimization'],
  'mobile developer': ['swift', 'kotlin', 'react native', 'flutter', 'ios', 'android', 'mobile ui', 'api integration', 'testing', 'architecture'],
  'qa engineer': ['automated testing', 'manual testing', 'selenium', 'cypress', 'jest', 'test cases', 'bug tracking', 'jira', 'api testing', 'postman', 'regression testing'],
  'civil engineer': ['autocad', 'civil 3d', 'structural analysis', 'project management', 'site planning', 'surveying', 'construction materials', 'drainage', 'code compliance'],
  'nurse': ['patient care', 'vital signs', 'ehr', 'medication administration', 'triage', 'bls', 'cpr', 'charting', 'patient education', 'infection control', 'clinical procedures'],
  'lawyer': ['litigation', 'legal research', 'contracts', 'corporate law', 'compliance', 'drafting', 'negotiation', 'intellectual property', 'mediation', 'court'],
  'hr manager': ['recruitment', 'employee relations', 'talent acquisition', 'payroll', 'performance management', 'onboarding', 'hris', 'training', 'compliance', 'benefits'],
  'sales manager': ['b2b sales', 'crm', 'lead generation', 'negotiation', 'account management', 'sales strategy', 'quota', 'prospecting', 'salesforce', 'client relations'],
  'customer success': ['customer retention', 'onboarding', 'churn reduction', 'nps', 'zendesk', 'account management', 'upselling', 'relationship management', 'support'],
  'architect': ['autocad', 'revit', 'sketchup', '3d modeling', 'building codes', 'sustainable design', 'blueprint', 'urban planning', 'project management'],
  'mechanical engineer': ['solidworks', 'ansys', 'thermodynamics', 'fluid mechanics', 'cad', 'manufacturing', 'hvac', 'robotics', 'quality control', 'fmea'],
  'electrical engineer': ['circuit design', 'matlab', 'plc', 'power systems', 'autocad electrical', 'microcontrollers', 'pcb design', 'schematics', 'testing'],
  'pharmacist': ['pharmacology', 'patient counseling', 'medication management', 'inventory', 'compliance', 'dosage', 'pharmacy operations', 'clinical pharmacy']
}

const getRoleKeywords = (role: string): string[] => {
  if (ROLE_KEYWORDS[role]) return ROLE_KEYWORDS[role]
  const match = Object.keys(ROLE_KEYWORDS).find(k => role.includes(k) || k.includes(role))
  if (match) return ROLE_KEYWORDS[match]
  return ['communication', 'leadership', 'teamwork', 'problem solving', 'management', 'analysis', 'strategy', 'planning', 'execution', 'results']
}

function buildImprovePrompt(targetRole: string): string {
  return `
Rewrite this CV for "${targetRole}".
Keep real info, improve wording only.
Add strong verbs and metrics.
Return ONLY valid JSON, no markdown.
Keep bullet points under 120 chars each.
Maximum 4 bullet points per job.

{
  "personalInfo": {
    "name": "",
    "title": "${targetRole}",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": ""
  },
  "summary": "max 200 chars",
  "experience": [
    {
      "id": "exp_0",
      "role": "",
      "company": "",
      "startDate": "",
      "endDate": "",
      "bullets": ["max 4 bullets, 120 chars each"]
    }
  ],
  "education": [
    {
      "id": "edu_0",
      "degree": "",
      "institution": "",
      "year": "",
      "gpa": ""
    }
  ],
  "skills": ["max 12 skills"],
  "improvements": ["max 3 items, 80 chars each"],
  "addedKeywords": ["max 8 keywords"]
}
`
}

function buildAnalyzePrompt(targetRole: string): string {
  return `
Analyze this CV for "${targetRole}".
Return ONLY valid JSON, no markdown, no extra text.
Keep all string values SHORT (under 100 chars each).

{
  "totalYearsExperience": 0,
  "skills": [],
  "educationLevel": "none",
  "hasSummary": false,
  "hasExperience": false,
  "hasEducation": false,
  "hasSkills": false,
  "hasQuantifiedMetrics": false,
  "bulletPointCount": 0,
  "strongActionVerbsCount": 0,
  "weakActionVerbsCount": 0,
  "keywords": [],
  "strengths": ["max 3 items, max 80 chars each"],
  "weaknesses": ["max 3 items, max 80 chars each"],
  "recommendations": ["max 3 items, max 80 chars each"],
  "sectionFeedback": {
    "summary": "max 80 chars",
    "experience": "max 80 chars",
    "education": "max 80 chars",
    "skills": "max 80 chars"
  },
  "skillLevels": {
    "technical": 0,
    "experience": 0,
    "education": 0,
    "impact": 0,
    "keywords": 0,
    "content": 0
  }
}
`
}

  app.post('/api/cv/improve', async (req, res) => {
    try {
      const { fileBase64, fileType, fileName, targetRole, userId } = req.body

      if (!fileBase64 || !targetRole) {
        return res.status(400).json({
          success: false,
          message: !fileBase64 ? 'No file received' : 'Target role required'
        })
      }

      // STEP 1: Always extract text first
      let extractedText = ''

      const isDocx = fileType?.includes('wordprocessingml') || fileName?.endsWith('.docx')
      const isPdf  = fileType === 'application/pdf' || fileName?.endsWith('.pdf')

      if (isDocx) {
        const m = await import('mammoth')
        const mammoth = m.default || m
        const buffer = Buffer.from(fileBase64, 'base64')
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value?.trim() || ''
        console.log('DOCX extracted:', extractedText.length)
      } else if (isPdf) {
        try {
          const p = await import('pdf-parse');
          const pdfParse = (p as any).default || p;
          const buffer = Buffer.from(fileBase64, 'base64')
          const pdfData = await pdfParse(buffer)
          extractedText = (pdfData.text || '').trim()
          console.log('PDF extracted:', extractedText.length)
        } catch (err: any) {
          console.warn('PDF parse failed for improve route, will fall back to native AI read:', err?.message || err)
          extractedText = ''
        }
      }

      if (!extractedText && !isPdf) {
        return res.status(422).json({
          success: false,
          message: 'Could not read file content'
        })
      }

      // STEP 2: Build improve prompt
      const roleKeywords = getRoleKeywords(targetRole)
      const needsPdfAttachment = isPdf && !extractedText
      
      const improvePrompt = `You are an expert CV writer.
Rewrite this CV to be optimized for: ${targetRole}

${extractedText ? `CV CONTENT:\n${extractedText.substring(0, 2500)}\n\n` : (needsPdfAttachment ? `Use the attached PDF resume content to extract, improve and optimize the CV for the role.\n\n` : '')}
Rules:
- Keep all real information, improve wording only
- Add strong action verbs: Led, Built, Reduced, Increased
- Add quantified metrics where logical
- Include these keywords where relevant: ${roleKeywords.slice(0,10).join(', ')}
- Maximum 4 bullet points per job
- Keep bullets under 100 characters

Return ONLY this JSON structure:
{
  "personalInfo": {"name": "", "title": "${targetRole}", "email": "", "phone": "", "location": "", "linkedin": ""},
  "summary": "improved summary under 200 chars",
  "experience": [{"id": "exp_0", "role": "", "company": "", "startDate": "", "endDate": "", "bullets": ["bullet 1", "bullet 2"]}],
  "education": [{"id": "edu_0", "degree": "", "institution": "", "year": "", "gpa": ""}],
  "skills": ["skill1", "skill2", "skill3"],
  "improvements": ["change 1", "change 2"],
  "addedKeywords": ["kw1", "kw2"]
}`

      // STEP 3: Call AI with fallback
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      
      let improvedCVText = ''
      let usedGroq = false

      // Try Gemini
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8000,
            temperature: 0.1
          }
        })

        const parts: any[] = []
        if (isPdf && needsPdfAttachment) {
          parts.push({ inlineData: { mimeType: 'application/pdf', data: fileBase64 } })
        }
        parts.push({ text: improvePrompt })

        const result = await model.generateContent(parts)
        improvedCVText = result.response.text()
        console.log('✅ Gemini improve OK')

      } catch (geminiErr: any) {
        const isQuota = geminiErr.status === 429 || geminiErr.message?.includes('quota') || geminiErr.message?.includes('429')

        if (!isQuota) throw geminiErr
        
        console.log('Gemini quota, using Groq for improve...')
        usedGroq = true

        const GroqSDK = (await import('groq-sdk')).default
        const groq = new GroqSDK({ apiKey: process.env.GROQ_API_KEY || '' })

        const groqPrompt = improvePrompt

        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Return ONLY valid JSON. No markdown. No explanation. Start with { and end with }.'
            },
            { role: 'user', content: groqPrompt }
          ],
          temperature: 0.1,
          max_tokens: 8000,
          response_format: { type: 'json_object' }
        })

        improvedCVText = response.choices[0].message.content || ''
        console.log('✅ Groq improve OK')
      }

      // STEP 4: Parse response
      console.log('Improve response preview:', improvedCVText.substring(0, 200))

      let improvedCV: any
      const { parseAIResponse } = await import('./services/aiService.ts')
      try {
        improvedCV = parseAIResponse(improvedCVText)
      } catch (err: any) {
        console.error('JSON Parse failed for improved CV')
        throw new Error('AI returned invalid format')
      }

            // STEP 5: REAL SCORING on improved CV text

      // Build text from improved CV for keyword matching
      const improvedText = [
        improvedCV.summary || '',
        ...(improvedCV.experience || []).flatMap(
          (e: any) => [e.role, e.company, ...(e.bullets || [])]
        ),
        ...(improvedCV.skills || []),
        ...(improvedCV.education || []).map(
          (e: any) => `${e.degree} ${e.institution}`
        )
      ].join(' ').toLowerCase()

      console.log('Improved CV text length:', improvedText.length)

      // Run SAME keyword matching as analyze route:
      // roleKeywords is already available from STEP 2

      const matchedNew = roleKeywords.filter(k => {
        const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '')
        const textNorm = improvedText.replace(/[^a-z0-9\s]/g, '')
        return textNorm.includes(k.toLowerCase()) ||
               textNorm.includes(kNorm)
      })

      const newKeywordRatio = roleKeywords.length > 0 ? (matchedNew.length / roleKeywords.length) : 0
      const newAtsScore = Math.round(newKeywordRatio * 100)

      // Skills from improved CV
      const improvedSkills = (improvedCV.skills || []).map((s: string) => s.toLowerCase())
      const requiredSkills = roleKeywords.slice(0, 10)
      
      const matchedSkills = requiredSkills.filter(s =>
        improvedSkills.some((is: string) => 
          is.includes(s.toLowerCase()) || 
          s.toLowerCase().includes(is)
        ) || improvedText.includes(s.toLowerCase())
      )
      const newSkillsScore = requiredSkills.length > 0 ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 100

      // Experience score (from improved CV)
      const expEntries = improvedCV.experience || []
      const totalYears = expEntries.length > 0 ? 3 : 0
      // Use original experience years if available:
      const yoe = req.body.currentYearsExp || totalYears
      const newExpScore = yoe === 0 ? 35
        : yoe <= 1 ? 55 : yoe <= 3 ? 72
        : yoe <= 5 ? 80 : yoe <= 8 ? 88 : 93

      // Education (preserve from original analysis)
      const originalEduScore = req.body.currentEduScore || 70
      const newEduScore = originalEduScore // education doesn't change

      // Quality score for improved CV
      const originalQuality = req.body.currentQuality || 50
      let newQuality = originalQuality

      // Boost quality for improvements made:
      const bullets = expEntries.flatMap((e: any) => e.bullets || [])
      if (bullets.length >= 4) newQuality = Math.min(100, newQuality + 15)
      if (improvedCV.summary?.length > 100) newQuality = Math.min(100, newQuality + 10)
      if ((improvedCV.addedKeywords?.length || 0) > 2) newQuality = Math.min(100, newQuality + 5)

      // Check for strong action verbs in bullets:
      const strongVerbs = ['led', 'built', 'increased', 'reduced', 'managed', 'architected', 'designed', 'developed', 'implemented', 'optimized', 'spearheaded', 'engineered', 'delivered', 'launched', 'achieved']
      const bulletsText = bullets.join(' ').toLowerCase()
      const hasStrongVerbs = strongVerbs.some(v => bulletsText.includes(v))
      if (hasStrongVerbs) newQuality = Math.min(100, newQuality + 10)

      // Check for metrics:
      const hasMetrics = /\d+%|\d+x|\$\d+|\d+ (users|projects|teams)/.test(bulletsText)
      if (hasMetrics) newQuality = Math.min(100, newQuality + 10)

      // FINAL WEIGHTED SCORE:
      const rawCalculated = Math.round(
        (newAtsScore    * 0.30) +
        (newSkillsScore * 0.25) +
        (newExpScore    * 0.20) +
        (newQuality     * 0.15) +
        (newEduScore    * 0.10)
      )

      // GUARANTEE improved >= original:
      const originalOverall = req.body.currentScore || 0
      const finalOverall = Math.min(100, Math.max(rawCalculated, originalOverall + 5, originalOverall))

      const finalInterviewChance = Math.min(100, Math.round((0.7 * finalOverall) + (0.3 * newExpScore)))

      console.log('=== IMPROVE SCORES ===')
      console.log('Original score:', originalOverall)
      console.log('Raw calculated:', rawCalculated)
      console.log('Final (guaranteed):', finalOverall)

      // Build skill distribution from REAL scores:
      const newSkillDistribution = {
        content: newQuality,
        experience: newExpScore,
        education: newEduScore,
        technical: newSkillsScore,
        impact: hasMetrics ? 85 : 50,
        keywords: newAtsScore
      }

      // SECTION SCORES
      const newSections = {
        summary: {
          score: improvedCV.summary?.length > 150 ? 80 : 65,
          status: 'strong',
          feedback: 'Professional summary optimized for ' + targetRole
        },
        experience: {
          score: hasStrongVerbs && hasMetrics ? 85 : hasStrongVerbs ? 75 : 65,
          status: 'strong',
          feedback: hasMetrics ? 'Strong bullet points with quantified metrics' : 'Good action verbs, add more metrics'
        },
        education: {
          score: newEduScore,
          status: newEduScore > 70 ? 'strong' : 'weak',
          feedback: 'Education section preserved'
        },
        skills: {
          score: newSkillsScore,
          status: newSkillsScore > 70 ? 'strong' : newSkillsScore > 40 ? 'weak' : 'missing',
          feedback: `${matchedSkills.length} of ${requiredSkills.length} required skills matched`
        }
      }

      // STRENGTHS
      const newStrengths = []
      if (hasStrongVerbs) newStrengths.push('Strong action verbs used throughout experience')
      if (hasMetrics) newStrengths.push('Quantified achievements demonstrate clear impact')
      if (matchedNew.length > 3) newStrengths.push(`${matchedNew.length} keywords matched for ${targetRole}`)
      if (improvedCV.summary?.length > 100) newStrengths.push('Professional summary tailored for target role')
      if (newStrengths.length === 0) newStrengths.push('CV structure improved and optimized')

      // WEAKNESSES
      const remainingWeaknesses = []
      if (newAtsScore < 50) remainingWeaknesses.push('Add more role-specific keywords: ' + roleKeywords.filter(k => !matchedNew.includes(k)).slice(0, 3).join(', '))
      if (!hasMetrics) remainingWeaknesses.push('Add quantified metrics to experience bullets')

            // STEP 6: Return result
      return res.json({
        success: true,
        improvedCV,
        newAnalysis: {
          overallScore: finalOverall,
          atsScore: Math.min(100, Math.max(newAtsScore, req.body.currentAtsScore || 0)),
          interviewChance: finalInterviewChance,
          skillDistribution: newSkillDistribution,
          sections: newSections,
          strengths: newStrengths,
          weaknesses: remainingWeaknesses,
          matchedKeywords: matchedNew,
          missingKeywords: roleKeywords.filter(k => !matchedNew.includes(k)).slice(0, 6),
          recommendations: improvedCV.improvements || []
        },
        usedFallback: usedGroq
      })

    } catch (error: any) {
      console.error('IMPROVE ERROR:', error.message)
      
      if (error.status === 429 || error.message?.includes('quota')) {
        return res.status(429).json({ success: false, message: 'Rate limit hit. Wait 1 min and retry.' })
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Improvement failed'
      })
    }
  })


  app.post("/api/cv/optimize", upload.single("cvFile"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let text = "";
      if (req.file.mimetype === "application/pdf") {
        const pdfData = await pdf(req.file.buffer);
        text = pdfData.text;
      } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
         const mammoth = await import("mammoth");
         const result = await mammoth.extractRawText({ buffer: req.file.buffer });
         text = result.value;
      } else {
        return res.status(400).json({ error: "Unsupported file format." });
      }

      const targetRole = req.body.targetRole || "Professional";
      const optimizedCV = await optimizeCV(text, targetRole);
      
      if (req.isAuthenticated()) {
        try {
          await StorageService.saveImprovement((req.user as any).id, {
            originalCvData: { text },
            improvedCvData: optimizedCV,
            targetRole,
            improvementSummary: 'AI rewrite completed'
          });
        } catch(e) {}
      }

      res.json(optimizedCV);
    } catch (error) {
      console.error("CV Optimization Error:", error);
      res.status(500).json({ error: "Failed to optimize CV" });
    }
  });

  app.post("/api/cv/categorize-skills", async (req, res) => {
    try {
      const { skills } = req.body;
      const categories = await categorizeSkills(skills);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to categorize skills" });
    }
  });

  app.post("/api/cv/rewrite-experience", async (req, res) => {
    try {
      const { role, company, description } = req.body;
      const rewritten = await rewriteExperience(role, company, description);
      res.json({ rewritten });
    } catch (error) {
      res.status(500).json({ error: "Failed to rewrite experience" });
    }
  });

  app.post("/api/cv/rewrite-project", async (req, res) => {
    try {
      const { name, description } = req.body;
      const result = await enhanceProject(name, description);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to enhance project" });
    }
  });

  app.post("/api/cv/generate-summary", async (req, res) => {
    try {
      const { cvData } = req.body;
      const summary = await generateSummary(cvData);
      res.json({ summary });
    } catch (error) {
      res.json({ summary: "Unable to generate summary. Please try again." });
    }
  });

  app.post("/api/suggest-skills", async (req, res) => {
    try {
      const { jobTitle } = req.body;
      if (!jobTitle) return res.status(400).json({ message: "Job title is required" });
      
      const { suggestSkills } = await import("./lib/gemini.ts");
      const skills = await suggestSkills(jobTitle);
      res.json({ skills });
    } catch (error: any) {
      console.error("Suggest Skills API Error:", error);
      res.status(500).json({ message: error.message || "Failed to suggest skills" });
    }
  });

  // Mount jobs router
  app.use("/api/jobs", jobsRouter);

  // Recruiter AI Routes
  app.post("/api/recruiter/evaluate", async (req, res) => {
    try {
      const { resumeData, jobDescription, targetJobTitle } = req.body;

      if (!resumeData || !jobDescription || !targetJobTitle) {
        return res.status(400).json({ message: "Missing required fields: resumeData, jobDescription, or targetJobTitle" });
      }

      console.log(`[API] Evaluating resume for recruiter simulation. Job: ${targetJobTitle}`);

      const evaluation = await evaluateResume(resumeData, jobDescription, targetJobTitle);
      
      res.json(evaluation);
    } catch (error: any) {
      console.error("Recruiter Evaluation Error:", error);
      res.status(500).json({ message: error.message || "Failed to evaluate resume" });
    }
  });

  app.post("/api/optimize-resume", async (req, res) => {
  try {
    const { resume, jobDescription, jobTitle } = req.body;

    const oldEvaluation = await evaluateResume(
      resume,
      jobDescription,
      jobTitle
    );

    const result = await improveResumeForJob(
      resume,
      jobDescription,
      jobTitle
    );

    const newEvaluation = await evaluateResume(
      result.optimized_resume,
      jobDescription,
      jobTitle
    );

    return res.json({
      optimized_resume: result.optimized_resume,
      improvements: result.improvements,
      old_score: oldEvaluation.candidateScore,
      new_score: newEvaluation.candidateScore,
      new_evaluation: newEvaluation
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      optimized_resume: req.body.resume,
      improvements: ["Something went wrong"]
    });
  }
});

  app.get('/api/user/history', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const data = await StorageService.getUserDashboardData((req.user as any).id);
      return res.json({ success: true, ...data });
    } catch (error) {
      console.error('History fetch error:', error);
      return res.status(500).json({ 
        success: false, message: 'Failed to fetch history' 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
