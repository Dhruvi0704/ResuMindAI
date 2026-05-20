import { db } from "../db";
import { 
  cvDocuments, cvAnalyses, atsEvaluations, 
  cvImprovements, mockInterviews, gapAnalyses, activityLog 
} from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";

export const StorageService = {

  // ── CV DOCUMENTS ──────────────────────────

  async saveCV(userId: string, cvData: any, 
               templateConfig: any, cvId?: string) {
    const cvName = cvData?.personalInfo?.name
      ? `${cvData.personalInfo.name}'s CV`
      : 'My CV';
    
    if (cvId) {
      const result = await db.update(cvDocuments)
        .set({ cvData, templateConfig, cvName,
               lastSaved: new Date() })
        .where(and(
          eq(cvDocuments.id, cvId),
          eq(cvDocuments.userId, userId)
        ))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(cvDocuments)
        .values({ userId, cvName, cvData, templateConfig })
        .returning();
      await StorageService.logActivity(userId, 
        'cv_created', { cvId: result[0].id });
      return result[0];
    }
  },

  async getUserCVs(userId: string) {
    return db.select().from(cvDocuments)
      .where(eq(cvDocuments.userId, userId))
      .orderBy(desc(cvDocuments.lastSaved));
  },

  async getCVById(cvId: string, userId: string) {
    const result = await db.select().from(cvDocuments)
      .where(and(
        eq(cvDocuments.id, cvId),
        eq(cvDocuments.userId, userId)
      ));
    return result[0] || null;
  },

  // ── CV ANALYSIS ───────────────────────────

  async saveAnalysis(userId: string, data: {
    cvDocumentId?: string,
    fileName: string,
    targetRole: string,
    overallScore: number,
    atsScore: number,
    interviewChance: number,
    analysisData: any,
    extractedText: string
  }) {
    const result = await db.insert(cvAnalyses)
      .values({ userId, ...data })
      .returning();
    
    await StorageService.logActivity(userId,
      'cv_analyzed', { 
        analysisId: result[0].id,
        score: data.overallScore,
        role: data.targetRole
      });
    
    return result[0];
  },

  async getUserAnalyses(userId: string) {
    return db.select().from(cvAnalyses)
      .where(eq(cvAnalyses.userId, userId))
      .orderBy(desc(cvAnalyses.createdAt))
      .limit(20);
  },

  // ── ATS EVALUATIONS ───────────────────────

  async saveATSEvaluation(userId: string, data: {
    cvDocumentId?: string,
    jobDescription: string,
    targetRole: string,
    candidateScore: number,
    atsKeywordScore: number,
    skillsMatchScore: number,
    experienceScore: number,
    educationScore: number,
    projectsScore: number,
    domainMatchPct: number,
    penaltyApplied: boolean,
    interviewChance: number,
    offerProbability: number,
    evaluationData: any
  }) {
    const result = await db.insert(atsEvaluations)
      .values({ userId, ...data })
      .returning();

    await StorageService.logActivity(userId,
      'ats_evaluated', {
        evaluationId: result[0].id,
        score: data.candidateScore,
        role: data.targetRole
      });

    return result[0];
  },

  // ── CV IMPROVEMENTS ───────────────────────

  async saveImprovement(userId: string, data: {
    cvDocumentId?: string,
    originalCvData: any,
    improvedCvData: any,
    targetRole: string,
    jobDescription?: string,
    improvementSummary?: string
  }) {
    const result = await db.insert(cvImprovements)
      .values({ userId, ...data })
      .returning();

    await StorageService.logActivity(userId,
      'cv_improved', {
        improvementId: result[0].id,
        role: data.targetRole
      });

    return result[0];
  },

  // ── MOCK INTERVIEWS ───────────────────────

  async saveInterviewSession(userId: string, data: {
    targetRole: string,
    questions: any[],
    answers: any[],
    scores: any,
    overallScore: number,
    feedback: string,
    duration: number
  }) {
    const result = await db.insert(mockInterviews)
      .values({ userId, ...data })
      .returning();

    await StorageService.logActivity(userId,
      'interview_completed', {
        interviewId: result[0].id,
        score: data.overallScore,
        role: data.targetRole
      });

    return result[0];
  },

  // ── GAP ANALYSIS ──────────────────────────

  async saveGapAnalysis(userId: string, data: {
    cvDocumentId?: string,
    jobDescription: string,
    overallMatch: number,
    domainMatchPct: number,
    penaltyApplied: boolean,
    sectionsData: any
  }) {
    const result = await db.insert(gapAnalyses)
      .values({ userId, ...data })
      .returning();
    return result[0];
  },

  // ── ACTIVITY LOG ──────────────────────────

  async logActivity(userId: string, 
                    action: string, 
                    metadata?: any) {
    await db.insert(activityLog)
      .values({ userId, action, metadata })
      .catch((err: any) => console.warn('Activity log failed:', err));
  },

  // ── USER HISTORY DASHBOARD ────────────────

  async getUserDashboardData(userId: string) {
    const [cvs, analyses, evaluations, 
           improvements, interviews] = await Promise.all([
      StorageService.getUserCVs(userId),
      StorageService.getUserAnalyses(userId),
      db.select().from(atsEvaluations)
        .where(eq(atsEvaluations.userId, userId))
        .orderBy(desc(atsEvaluations.createdAt)).limit(10),
      db.select().from(cvImprovements)
        .where(eq(cvImprovements.userId, userId))
        .orderBy(desc(cvImprovements.createdAt)).limit(10),
      db.select().from(mockInterviews)
        .where(eq(mockInterviews.userId, userId))
        .orderBy(desc(mockInterviews.createdAt)).limit(10),
    ]);
    return { cvs, analyses, evaluations, improvements, interviews };
  }
};
