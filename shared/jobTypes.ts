export interface JobRecommendation {
    id: string;
    title: string;
    company: string;
    location: string;
    platform: string; // LinkedIn, Naukri, etc.
    description: string;
    requiredSkills: string[];
    url: string;
    postedDate: string;
    matchScore: number; // 0-100 indicating relevance
}

export interface ExtractedResumeData {
    skills: string[];
    jobRoles: string[];
    experienceLevel: string;
    industryKeywords: string[];
}
