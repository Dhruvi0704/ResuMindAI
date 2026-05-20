// Advanced NLP Utilities for ATS Analysis

export interface TokenizeOptions {
    preserveTechnicalTerms?: boolean;
    lowercase?: boolean;
}

export interface KeywordExtractionResult {
    keyword: string;
    frequency: number;
    tfidf: number;
    category: 'technical' | 'soft' | 'domain' | 'other';
}

// Enhanced stop words list (common words to exclude)
const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to',
    'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had',
    'what', 'when', 'where', 'who', 'which', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'than',
    'too', 'very', 'can', 'could', 'may', 'might', 'must', 'shall', 'should',
    'would', 'or', 'not', 'only', 'own', 'same', 'so', 'then', 'there',
    'these', 'those', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'into', 'under', 'again', 'further', 'once', 'here', 'we',
    'our', 'ours', 'your', 'yours', 'their', 'theirs', 'them', 'yourself',
    'image', 'button', 'click', 'page', 'link', 'website', 'pdf', 'document'
]);

// Common technical skill categories
const TECHNICAL_KEYWORDS = new Set([
    'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
    'node', 'express', 'django', 'flask', 'spring', 'api', 'rest', 'graphql',
    'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'docker',
    'kubernetes', 'aws', 'azure', 'gcp', 'cloud', 'devops', 'ci/cd', 'git',
    'github', 'gitlab', 'agile', 'scrum', 'jira', 'machine learning', 'ai',
    'data science', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
    'html', 'css', 'sass', 'webpack', 'babel', 'testing', 'jest', 'cypress',
    'selenium', 'microservices', 'architecture', 'design patterns', 'oop',
    'functional programming', 'algorithms', 'data structures', 'linux', 'bash'
]);

const SOFT_SKILLS = new Set([
    'leadership', 'communication', 'teamwork', 'collaboration', 'problem-solving',
    'critical thinking', 'creativity', 'adaptability', 'time management',
    'organization', 'analytical', 'detail-oriented', 'self-motivated',
    'proactive', 'initiative', 'interpersonal', 'presentation', 'negotiation',
    'conflict resolution', 'mentoring', 'coaching', 'decision-making'
]);

const DOMAIN_KEYWORDS = new Set([
    'finance', 'healthcare', 'e-commerce', 'retail', 'education', 'marketing',
    'sales', 'customer service', 'product management', 'project management',
    'business analysis', 'data analysis', 'research', 'development',
    'engineering', 'design', 'ux', 'ui', 'frontend', 'backend', 'full-stack'
]);

// Common technical synonyms
const SYNONYMS: Record<string, string[]> = {
    'javascript': ['js', 'ecmascript'],
    'typescript': ['ts'],
    'python': ['py'],
    'machine learning': ['ml', 'ai', 'artificial intelligence'],
    'database': ['db', 'databases'],
    'api': ['rest api', 'restful', 'web service'],
    'frontend': ['front-end', 'client-side', 'ui'],
    'backend': ['back-end', 'server-side'],
    'devops': ['dev ops', 'continuous integration'],
    'ui/ux': ['user interface', 'user experience', 'design'],
};

/**
 * Tokenize text into words with advanced preprocessing
 */
export function tokenize(text: string, options: TokenizeOptions = {}): string[] {
    const { preserveTechnicalTerms = true, lowercase = true } = options;

    // Normalize text
    let processed = text;
    if (lowercase) {
        processed = processed.toLowerCase();
    }

    // Remove special characters but preserve technical terms like C++, C#, .NET
    processed = processed
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s\+\#\.\/\-]/g, ' '); // Keep +, #, ., /, -

    // Split into tokens
    const tokens = processed.split(/\s+/).filter(token => token.length > 0);

    // Filter out stop words
    const filtered = tokens.filter(token => {
        // Preserve technical terms even if they're in stop words
        if (preserveTechnicalTerms && TECHNICAL_KEYWORDS.has(token)) {
            return true;
        }
        return !STOP_WORDS.has(token) && token.length > 1;
    });

    return filtered;
}

/**
 * Calculate Term Frequency (TF)
 */
function calculateTF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    const totalTokens = tokens.length;

    for (const token of tokens) {
        tf.set(token, (tf.get(token) || 0) + 1 / totalTokens);
    }

    return tf;
}

/**
 * Calculate Inverse Document Frequency (IDF)
 * For simplicity, we use a single document approach with frequency-based weighting
 */
function calculateIDF(tokens: string[], allTokens: string[]): Map<string, number> {
    const idf = new Map<string, number>();
    const uniqueTokens = new Set(tokens);

    for (const token of Array.from(uniqueTokens)) {
        const frequency = allTokens.filter(t => t === token).length;
        // Higher frequency = lower IDF (common words are less important)
        idf.set(token, Math.log(allTokens.length / (frequency + 1)));
    }

    return idf;
}

/**
 * Categorize a keyword based on predefined lists
 */
export function categorizeKeyword(keyword: string): 'technical' | 'soft' | 'domain' | 'other' {
    const normalized = keyword.toLowerCase();

    if (TECHNICAL_KEYWORDS.has(normalized)) return 'technical';
    if (SOFT_SKILLS.has(normalized)) return 'soft';
    if (DOMAIN_KEYWORDS.has(normalized)) return 'domain';

    // Check for partial matches in technical keywords
    for (const tech of Array.from(TECHNICAL_KEYWORDS)) {
        if (normalized.includes(tech) || tech.includes(normalized)) {
            return 'technical';
        }
    }

    return 'other';
}

/**
 * Extract keywords with TF-IDF weighting
 */
export function extractKeywords(
    text: string,
    topN: number = 50
): KeywordExtractionResult[] {
    const tokens = tokenize(text, { preserveTechnicalTerms: true });

    if (tokens.length === 0) {
        return [];
    }

    const tf = calculateTF(tokens);
    const idf = calculateIDF(tokens, tokens);

    // Calculate TF-IDF scores
    const tfidfScores: KeywordExtractionResult[] = [];

    for (const [keyword, tfScore] of Array.from(tf.entries())) {
        const idfScore = idf.get(keyword) || 0;
        const tfidf = tfScore * idfScore;

        tfidfScores.push({
            keyword,
            frequency: tokens.filter(t => t === keyword).length,
            tfidf,
            category: categorizeKeyword(keyword),
        });
    }

    // Sort by TF-IDF score and return top N
    return tfidfScores
        .sort((a, b) => b.tfidf - a.tfidf)
        .slice(0, topN);
}

/**
 * Find synonyms for a given keyword
 */
export function findSynonyms(keyword: string): string[] {
    const normalized = keyword.toLowerCase();

    // Check if keyword is a synonym
    for (const [main, syns] of Object.entries(SYNONYMS)) {
        if (syns.includes(normalized)) {
            return [main, ...syns.filter(s => s !== normalized)];
        }
        if (main === normalized) {
            return syns;
        }
    }

    return [];
}

/**
 * Match keywords with synonym support
 */
export function matchKeywordsWithSynonyms(
    resumeKeywords: string[],
    jdKeywords: string[]
): { matched: string[]; unmatched: string[] } {
    const resumeSet = new Set(resumeKeywords.map(k => k.toLowerCase()));
    const matched: string[] = [];
    const unmatched: string[] = [];

    for (const jdKeyword of jdKeywords) {
        const normalized = jdKeyword.toLowerCase();
        let found = resumeSet.has(normalized);

        // Check synonyms if not found
        if (!found) {
            const synonyms = findSynonyms(normalized);
            found = synonyms.some(syn => resumeSet.has(syn));
        }

        if (found) {
            matched.push(jdKeyword);
        } else {
            unmatched.push(jdKeyword);
        }
    }

    return { matched, unmatched };
}

/**
 * Calculate keyword similarity percentage
 */
export function calculateKeywordSimilarity(
    resumeText: string,
    jdText: string
): number {
    const resumeTokens = new Set(tokenize(resumeText));
    const jdTokens = new Set(tokenize(jdText));

    const intersection = new Set(Array.from(resumeTokens).filter(t => jdTokens.has(t)));
    const union = new Set([...Array.from(resumeTokens), ...Array.from(jdTokens)]);

    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}
