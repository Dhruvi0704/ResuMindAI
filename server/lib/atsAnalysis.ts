// Core ATS Analysis Engine - Dual Scoring System

import {
    ATSAnalysisResult,
    ATSAnalysisRequest,
    KeywordScore,
    SemanticScore,
    SkillGap,
    ATSRecommendation,
    KeywordMatch,
    SkillCategory,
} from '../../shared/atsTypes.ts';
import {
    extractKeywords,
    tokenize,
    categorizeKeyword,
    matchKeywordsWithSynonyms,
    calculateKeywordSimilarity,
} from './nlpUtils.ts';

// Python Microservice configuration
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Get sentence embeddings from Python SBERT microservice
 */
async function getSentenceEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        console.log(`[ATS] Calling Python SBERT service at ${PYTHON_SERVICE_URL}/embeddings`);

        const response = await fetch(`${PYTHON_SERVICE_URL}/embeddings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: texts,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(`Python service error: ${errorData.error || response.statusText}`);
        }

        const embeddings = await response.json();

        if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
            throw new Error('Invalid embeddings response from Python service');
        }

        console.log(`[ATS] ✓ Received ${embeddings.length} embeddings from Python service`);
        return embeddings;
    } catch (error: any) {
        console.error('[ATS] Error fetching embeddings from Python service:', error);

        // Check if it's a connection error
        if (error.message.includes('fetch failed') || error.code === 'ECONNREFUSED') {
            console.warn(`
╔════════════════════════════════════════════════════════════╗
║  PYTHON MICROSERVICE NOT RUNNING                           ║
╟────────────────────────────────────────────────────────────╢
║  The ATS analysis requires the Python SBERT service.       ║
║  Please start it before using semantic analysis:           ║
║                                                             ║
║  1. Open a new terminal                                    ║
║  2. cd ats-semantic-service                                ║
║  3. pip install -r requirements.txt (first time only)      ║
║  4. python app.py                                          ║
║                                                             ║
║  Falling back to keyword-based similarity...               ║
╚════════════════════════════════════════════════════════════╝
            `);
        }

        // Fallback: return dummy embeddings
        console.warn('[ATS] Falling back to keyword-based similarity');
        return texts.map(() => Array(384).fill(0));
    }
}

/**
 * Calculate keyword-based ATS score
 */
export async function calculateKeywordScore(
    resumeText: string,
    jdText: string
): Promise<KeywordScore> {
    // Extract keywords from both texts
    const resumeKeywords = extractKeywords(resumeText, 100);
    const jdKeywords = extractKeywords(jdText, 100);

    // Match keywords with synonym support
    const jdKeywordList = jdKeywords.map(k => k.keyword);
    const resumeKeywordList = resumeKeywords.map(k => k.keyword);

    const { matched, unmatched } = matchKeywordsWithSynonyms(resumeKeywordList, jdKeywordList);

    // Build matched keywords with details
    const matchedKeywords: KeywordMatch[] = matched.map(keyword => {
        const jdKeyword = jdKeywords.find(k => k.keyword === keyword);
        const resumeKeyword = resumeKeywords.find(k => k.keyword === keyword);

        return {
            keyword,
            category: jdKeyword?.category || 'other',
            frequency: resumeKeyword?.frequency || 1,
            relevanceScore: jdKeyword?.tfidf || 0,
        };
    });

    // Calculate category breakdown
    const categoryBreakdown = {
        technical: { matched: 0, total: 0 },
        soft: { matched: 0, total: 0 },
        domain: { matched: 0, total: 0 },
        other: { matched: 0, total: 0 },
    };

    // Count JD keywords by category
    for (const keyword of jdKeywords) {
        categoryBreakdown[keyword.category].total++;
    }

    // Count matched keywords by category
    for (const match of matchedKeywords) {
        categoryBreakdown[match.category].matched++;
    }

    // Calculate match ratio
    const totalJDKeywords = jdKeywords.length;
    const matchRatio = totalJDKeywords > 0 ? matched.length / totalJDKeywords : 0;

    // Calculate weighted score (prioritize technical and domain skills)
    const weights = {
        technical: 0.4,
        domain: 0.3,
        soft: 0.2,
        other: 0.1,
    };

    let weightedScore = 0;
    let totalWeight = 0;

    for (const [category, weight] of Object.entries(weights)) {
        const cat = category as SkillCategory;
        const { matched: m, total: t } = categoryBreakdown[cat];
        if (t > 0) {
            weightedScore += (m / t) * weight;
            totalWeight += weight;
        }
    }

    // Normalize to 0-100 scale
    const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

    return {
        score,
        totalKeywords: totalJDKeywords,
        matchedKeywords,
        missingKeywords: unmatched,
        matchRatio,
        categoryBreakdown,
    };
}

/**
 * Calculate semantic similarity score using SBERT
 */
export async function calculateSemanticScore(
    resumeText: string,
    jdText: string
): Promise<SemanticScore> {
    try {
        // Get embeddings for both texts
        const embeddings = await getSentenceEmbeddings([resumeText, jdText]);

        if (embeddings.length !== 2) {
            throw new Error('Failed to get embeddings');
        }

        const [resumeEmbedding, jdEmbedding] = embeddings;

        // Calculate cosine similarity
        const similarity = cosineSimilarity(resumeEmbedding, jdEmbedding);
        const similarityPercentage = Math.max(0, Math.min(100, similarity * 100));

        // Convert to 0-100 score (boost the score slightly for better UX)
        const score = Math.round(Math.min(100, similarityPercentage * 1.1));

        // Analyze semantic strengths and gaps
        const resumeTokens = tokenize(resumeText, { preserveTechnicalTerms: true });
        const jdTokens = tokenize(jdText, { preserveTechnicalTerms: true });

        // Find contextual matches (tokens that appear in similar context)
        const contextualMatches = resumeTokens.filter(token => jdTokens.includes(token)).slice(0, 10);

        // Identify semantic strengths (high-value keywords present)
        const semanticStrengths = contextualMatches
            .filter(token => categorizeKeyword(token) === 'technical' || categorizeKeyword(token) === 'domain')
            .slice(0, 5);

        // Identify semantic gaps (high-value JD keywords missing from resume)
        const resumeTokenSet = new Set(resumeTokens);
        const semanticGaps = jdTokens
            .filter(token => !resumeTokenSet.has(token))
            .filter(token => categorizeKeyword(token) === 'technical' || categorizeKeyword(token) === 'domain')
            .slice(0, 5);

        return {
            score,
            similarityPercentage,
            contextualMatches,
            semanticStrengths,
            semanticGaps,
        };
    } catch (error) {
        console.error('Semantic analysis error:', error);

        // Fallback to simple keyword similarity
        const similarity = calculateKeywordSimilarity(resumeText, jdText);

        return {
            score: Math.round(similarity),
            similarityPercentage: similarity,
            contextualMatches: [],
            semanticStrengths: ['Fallback mode: Using keyword-based similarity'],
            semanticGaps: [],
        };
    }
}

/**
 * Identify skill gaps from keyword analysis
 */
function identifySkillGaps(keywordScore: KeywordScore): SkillGap[] {
    const gaps: SkillGap[] = [];

    // Prioritize missing keywords by category
    const missingByCategory: Record<SkillCategory, string[]> = {
        technical: [],
        soft: [],
        domain: [],
        other: [],
    };

    for (const keyword of keywordScore.missingKeywords) {
        const category = categorizeKeyword(keyword);
        missingByCategory[category].push(keyword);
    }

    // Create skill gaps with priority
    const addGaps = (category: SkillCategory, priority: 'high' | 'medium' | 'low', limit: number) => {
        const skills = missingByCategory[category].slice(0, limit);
        for (const skill of skills) {
            gaps.push({
                skill,
                category,
                priority,
                reason: `Missing ${category} skill from job description`,
            });
        }
    };

    // Technical skills are high priority
    addGaps('technical', 'high', 5);
    // Domain skills are medium priority
    addGaps('domain', 'medium', 3);
    // Soft skills are low priority (often implied)
    addGaps('soft', 'low', 2);

    return gaps;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
    keywordScore: KeywordScore,
    semanticScore: SemanticScore,
    skillGaps: SkillGap[]
): ATSRecommendation[] {
    const recommendations: ATSRecommendation[] = [];

    // Overall score assessment
    const avgScore = (keywordScore.score + semanticScore.score) / 2;

    if (avgScore < 60) {
        recommendations.push({
            text: 'Your resume has a low match with the job description. Consider tailoring your resume to highlight relevant skills and experience.',
            priority: 'high',
            category: 'Overall',
            actionable: true,
        });
    } else if (avgScore < 80) {
        recommendations.push({
            text: 'Good match, but there is room for improvement. Focus on adding missing keywords and skills.',
            priority: 'medium',
            category: 'Overall',
            actionable: true,
        });
    } else {
        recommendations.push({
            text: 'Excellent match! Your resume aligns well with the job description.',
            priority: 'low',
            category: 'Overall',
            actionable: false,
        });
    }

    // Keyword-specific recommendations
    if (keywordScore.matchRatio < 0.5) {
        recommendations.push({
            text: 'Add more relevant keywords from the job description to improve ATS compatibility.',
            priority: 'high',
            category: 'Keywords',
            actionable: true,
        });
    }

    // Technical skills gaps
    const techGaps = skillGaps.filter(g => g.category === 'technical' && g.priority === 'high');
    if (techGaps.length > 0) {
        const topSkills = techGaps.slice(0, 3).map(g => g.skill).join(', ');
        recommendations.push({
            text: `Consider adding these technical skills if you have them: ${topSkills}`,
            priority: 'high',
            category: 'Technical Skills',
            actionable: true,
        });
    }

    // Semantic analysis insights
    if (semanticScore.score < keywordScore.score - 15) {
        recommendations.push({
            text: 'While you have matching keywords, the context and phrasing could be improved to better align with the job description.',
            priority: 'medium',
            category: 'Content Quality',
            actionable: true,
        });
    }

    // Category-specific recommendations
    for (const [category, data] of Object.entries(keywordScore.categoryBreakdown)) {
        const cat = category as SkillCategory;
        if (data.total > 0 && data.matched / data.total < 0.3) {
            recommendations.push({
                text: `Strengthen your ${category} skills section - only ${data.matched}/${data.total} requirements are matched.`,
                priority: category === 'technical' ? 'high' : 'medium',
                category: `${category.charAt(0).toUpperCase() + category.slice(1)} Skills`,
                actionable: true,
            });
        }
    }

    // Limit to top 6 recommendations
    return recommendations
        .sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, 6);
}

/**
 * Perform comprehensive ATS analysis
 */
export async function performATSAnalysis(
    request: ATSAnalysisRequest
): Promise<ATSAnalysisResult> {
    const startTime = Date.now();

    const { resumeText, jobDescription } = request;

    // Calculate both scores concurrently
    const [keywordScore, semanticScore] = await Promise.all([
        calculateKeywordScore(resumeText, jobDescription),
        calculateSemanticScore(resumeText, jobDescription),
    ]);

    // Calculate final weighted score (60% keyword, 40% semantic)
    const finalScore = Math.round(keywordScore.score * 0.6 + semanticScore.score * 0.4);

    // Identify skill gaps
    const skillGaps = identifySkillGaps(keywordScore);

    // Generate recommendations
    const recommendations = generateRecommendations(keywordScore, semanticScore, skillGaps);

    const processingTime = Date.now() - startTime;

    return {
        keywordScore,
        semanticScore,
        finalScore,
        skillGaps,
        recommendations,
        resumeWordCount: tokenize(resumeText).length,
        jdWordCount: tokenize(jobDescription).length,
        processingTime,
        timestamp: new Date().toISOString(),
    };
}
