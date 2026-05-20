export type JobCategory = 'Tech' | 'Commerce' | 'Creative' | 'General';

export function detectJobCategory(jobTitle: string): JobCategory {
    if (!jobTitle) return 'General';
    
    const title = jobTitle.toLowerCase();
    
    // Tech Roles
    const techKeywords = ['software', 'developer', 'engineer', 'data', 'ai', 'devops', 'programmer', 'web', 'it', 'cloud', 'security', 'tech', 'backend', 'frontend', 'fullstack'];
    if (techKeywords.some(kw => title.includes(kw))) return 'Tech';

    // Creative/Arts Roles
    const creativeKeywords = ['designer', 'ui', 'ux', 'content', 'writer', 'video', 'editor', 'animator', 'creative', 'art', 'graphics', 'illustration', 'copywriter'];
    // UI/UX might be caught as just letters, so boundary check might be better, but includes('ui') might match 'build', so let's refine:
    const exactCreativeWords = title.split(/[\s/|-]/);
    if (exactCreativeWords.includes('ui') || exactCreativeWords.includes('ux') || exactCreativeWords.includes('ui/ux')) return 'Creative';
    if (creativeKeywords.some(kw => title.includes(kw)) && !title.includes('build') && !title.includes('guide')) return 'Creative';

    // Commerce/Business Roles
    const commerceKeywords = ['accountant', 'finance', 'analyst', 'marketing', 'hr', 'human resources', 'business', 'manager', 'sales', 'executive', 'operations', 'strategy', 'product'];
    if (commerceKeywords.some(kw => title.includes(kw))) return 'Commerce';
    
    // Exact word checks for cases 'operations executive' -> Commerce
    if (exactCreativeWords.includes('operations')) return 'Commerce';

    // Default to General
    return 'General';
}

export type SectionId = 'personal' | 'education' | 'skills' | 'experience' | 'projects' | 'certifications' | 'links';

export function getDynamicSectionOrder(jobTitle: string | undefined): SectionId[] {
    const category = jobTitle ? detectJobCategory(jobTitle) : 'General';
    
    // We map the standard internal section identifiers:
    // 'personal', 'skills', 'experience', 'projects', 'education', 'certifications', 'links'
    
    switch (category) {
        case 'Tech':
            // Tech: Header, Summary, Tech Skills, Projects, Experience, Education, Certifications, Links
            return ['personal', 'skills', 'projects', 'experience', 'education', 'certifications', 'links'];
        case 'Commerce':
            // Commerce: Header, Summary, Core Skills, Experience, Education, Certifications, Projects, Links
            return ['personal', 'skills', 'experience', 'education', 'certifications', 'projects', 'links'];
        case 'Creative':
            // Creative: Header, Summary, Creative Skills, Links(Portfolio), Projects, Experience, Education, Certifications
            return ['personal', 'skills', 'links', 'projects', 'experience', 'education', 'certifications'];
        case 'General':
        default:
            // General: Header, Objective, Key Skills, Experience, Education, Certifications, Projects, Links
            return ['personal', 'skills', 'experience', 'education', 'certifications', 'projects', 'links'];
    }
}
