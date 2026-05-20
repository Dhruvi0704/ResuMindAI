export interface PersonalInfo {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    professionalSummary: string;
    photoUrl?: string;
}

export interface Education {
    id: string;
    institution: string;
    degree: string;
    specialization: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    order: number;
}

export type SkillCategory = 'programming' | 'frameworks' | 'tools' | 'soft';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Skill {
    id: string;
    name: string;
    category: SkillCategory;
    level: SkillLevel;
}

export interface Experience {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    current: boolean;
    responsibilities: string[];
    bullets?: string[];
    order: number;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    techStack: string[];
    githubUrl?: string;
    liveUrl?: string;
    order: number;
}

export interface Certification {
    id: string;
    name: string;
    issuer: string;
    date: string;
    order: number;
}

export interface SocialLinks {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    leetcode?: string;
    kaggle?: string;
    twitter?: string;
}

export interface ResumeData {
    personal: PersonalInfo;
    education: Education[];
    skills: Skill[];
    experience: Experience[];
    projects: Project[];
    certifications: Certification[];
    socialLinks: SocialLinks;
    templateId: string;
    version: number;
    createdAt: string;
    updatedAt: string;
}

export type WizardStep =
    | 'personal'
    | 'education'
    | 'skills'
    | 'experience'
    | 'projects'
    | 'certifications'
    | 'links'
    | 'review';

export interface WizardState {
    currentStep: WizardStep;
    completedSteps: WizardStep[];
    resumeData: ResumeData;
}

// Helper function to create empty resume data
export const createEmptyResumeData = (): ResumeData => ({
    personal: {
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        professionalSummary: '',
    },
    education: [],
    skills: [],
    experience: [],
    projects: [],
    certifications: [],
    socialLinks: {},
    templateId: 'professional-clean',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

// Helper to generate unique IDs
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
