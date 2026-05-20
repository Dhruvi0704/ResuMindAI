// Shared TypeScript types for ATS Analysis

export type SkillCategory = 'technical' | 'soft' | 'domain' | 'other';

export interface KeywordMatch {
    keyword: string;
    category: SkillCategory;
    frequency: number;
    relevanceScore: number;
}

export interface KeywordScore {
    score: number; // 0-100
    totalKeywords: number;
    matchedKeywords: KeywordMatch[];
    missingKeywords: string[];
    matchRatio: number;
    categoryBreakdown: {
        technical: { matched: number; total: number };
        soft: { matched: number; total: number };
        domain: { matched: number; total: number };
        other: { matched: number; total: number };
    };
}

export interface SemanticScore {
    score: number; // 0-100
    similarityPercentage: number;
    contextualMatches: string[];
    semanticStrengths: string[];
    semanticGaps: string[];
}

export interface SkillGap {
    skill: string;
    category: SkillCategory;
    priority: 'high' | 'medium' | 'low';
    reason: string;
}

export interface ATSRecommendation {
    text: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
    actionable: boolean;
}

export interface ATSAnalysisResult {
    // Dual Scores
    keywordScore: KeywordScore;
    semanticScore: SemanticScore;
    finalScore: number; // Weighted combination

    // Analysis Details
    skillGaps: SkillGap[];
    recommendations: ATSRecommendation[];

    // Metadata
    resumeWordCount: number;
    jdWordCount: number;
    processingTime: number;
    timestamp: string;
}

export interface ATSAnalysisRequest {
    resumeText: string;
    jobDescription: string;
    jobRole?: string;
}
