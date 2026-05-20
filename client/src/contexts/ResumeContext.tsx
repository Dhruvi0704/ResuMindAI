import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ResumeData, WizardStep, createEmptyResumeData } from '@/types/resume';

interface ResumeState {
    resumeData: ResumeData;
    currentStep: WizardStep;
    completedSteps: WizardStep[];
    validationErrors: Record<string, string>;
    gapReport: any | null;
    isAnalyzingGap: boolean;
}

type ResumeAction =
    | { type: 'UPDATE_PERSONAL'; payload: Partial<ResumeData['personal']> }
    | { type: 'ADD_EDUCATION'; payload?: any }
    | { type: 'UPDATE_EDUCATION'; payload?: { id: string; data: Partial<ResumeData['education'][0]> }; index?: number; field?: string; value?: any }
    | { type: 'DELETE_EDUCATION'; payload?: string; index?: number }
    | { type: 'REORDER_EDUCATION'; payload: ResumeData['education'] }
    | { type: 'ADD_SKILL'; payload: ResumeData['skills'][0] }
    | { type: 'DELETE_SKILL'; payload: string }
    | { type: 'UPDATE_SKILLS'; payload: ResumeData['skills'] }
    | { type: 'ADD_EXPERIENCE'; payload: any }
    | { type: 'UPDATE_EXPERIENCE'; payload?: { id: string; data: Partial<ResumeData['experience'][0]> }; index?: number; field?: string; value?: any }
    | { type: 'DELETE_EXPERIENCE'; payload?: string; index?: number }
    | { type: 'ADD_EXPERIENCE_BULLET'; index: number }
    | { type: 'UPDATE_EXPERIENCE_BULLET'; index: number; bulletIndex: number; value: string }
    | { type: 'DELETE_EXPERIENCE_BULLET'; index: number; bulletIndex: number }
    | { type: 'REORDER_EXPERIENCE'; payload: ResumeData['experience'] }
    | { type: 'ADD_PROJECT'; payload: ResumeData['projects'][0] }
    | { type: 'UPDATE_PROJECT'; payload: { id: string; data: Partial<ResumeData['projects'][0]> } }
    | { type: 'DELETE_PROJECT'; payload: string }
    | { type: 'REORDER_PROJECTS'; payload: ResumeData['projects'] }
    | { type: 'ADD_CERTIFICATION'; payload: ResumeData['certifications'][0] }
    | { type: 'UPDATE_CERTIFICATION'; payload: { id: string; data: Partial<ResumeData['certifications'][0]> } }
    | { type: 'DELETE_CERTIFICATION'; payload: string }
    | { type: 'UPDATE_SOCIAL_LINKS'; payload: Partial<ResumeData['socialLinks']> }
    | { type: 'SET_TEMPLATE'; payload: string }
    | { type: 'SET_STEP'; payload: WizardStep }
    | { type: 'MARK_STEP_COMPLETE'; payload: WizardStep }
    | { type: 'LOAD_RESUME'; payload: ResumeData }
    | { type: 'UPDATE_ENTIRE_RESUME'; payload: ResumeData }
    | { type: 'RESET_RESUME' }
    | { type: 'SET_VALIDATION_ERROR'; payload: { field: string; error: string } }
    | { type: 'CLEAR_VALIDATION_ERROR'; payload: string }
    | { type: 'SET_GAP_REPORT'; payload: any }
    | { type: 'CLEAR_GAP_REPORT' }
    | { type: 'SET_GAP_ANALYSIS_LOADING'; payload: boolean }
    | { type: 'UPDATE_FIELD'; payload: { section: string; field: string; value: any } }
    | { type: 'LOAD_CV'; payload: any };

const initialState: ResumeState = {
    resumeData: createEmptyResumeData(),
    currentStep: 'personal',
    completedSteps: [],
    validationErrors: {},
    gapReport: null,
    isAnalyzingGap: false,
};

function resumeReducer(state: ResumeState, action: ResumeAction): ResumeState {
    switch (action.type) {
        case 'UPDATE_FIELD':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    [action.payload.section]: {
                        ...(state.resumeData as any)[action.payload.section],
                        [action.payload.field]: action.payload.value
                    },
                    updatedAt: new Date().toISOString(),
                }
            };

        case 'UPDATE_PERSONAL':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    personal: { ...state.resumeData.personal, ...action.payload },
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'ADD_EDUCATION':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    education: [
                      ...(state.resumeData.education || []),
                      action.payload || {
                        id: crypto.randomUUID(),
                        degree: '',
                        institution: '',
                        year: '',
                        gpa: ''
                      }
                    ],
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'UPDATE_EDUCATION':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    education: state.resumeData.education.map((edu, i) => {
                        if (action.payload) return edu.id === action.payload.id ? { ...edu, ...action.payload.data } : edu;
                        return i === action.index ? { ...edu, [action.field as string]: action.value } : edu;
                    }),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'DELETE_EDUCATION':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    education: state.resumeData.education.filter((edu, i) => 
                        action.payload ? edu.id !== action.payload : i !== action.index
                    ),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'REORDER_EDUCATION':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    education: action.payload,
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'ADD_SKILL':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    skills: [...state.resumeData.skills, action.payload],
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'DELETE_SKILL':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    skills: state.resumeData.skills.filter(skill => skill.id !== action.payload),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'UPDATE_SKILLS':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    skills: action.payload,
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'ADD_EXPERIENCE':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    experience: [...(state.resumeData.experience || []), action.payload],
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'UPDATE_EXPERIENCE':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    experience: state.resumeData.experience.map((exp, i) => {
                        if (action.payload) return exp.id === action.payload.id ? { ...exp, ...action.payload.data } : exp;
                        return i === action.index ? { ...exp, [action.field as string]: action.value } : exp;
                    }),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'DELETE_EXPERIENCE':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    experience: state.resumeData.experience.filter((exp, i) => 
                         action.payload ? exp.id !== action.payload : i !== action.index
                    ),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'ADD_EXPERIENCE_BULLET':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    experience: state.resumeData.experience.map((exp, i) =>
                        i === action.index ? { ...exp, bullets: [...(exp.bullets || []), ''] } : exp
                    ),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'UPDATE_EXPERIENCE_BULLET':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    experience: state.resumeData.experience.map((exp, i) =>
                        i === action.index
                            ? {
                                ...exp,
                                bullets: (exp.bullets || []).map((b: string, j: number) =>
                                    j === action.bulletIndex ? action.value : b
                                )
                            }
                            : exp
                    ),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'DELETE_EXPERIENCE_BULLET':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    experience: state.resumeData.experience.map((exp, i) =>
                        i === action.index
                            ? {
                                ...exp,
                                bullets: (exp.bullets || []).filter((_: any, j: number) => j !== action.bulletIndex)
                            }
                            : exp
                    ),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'REORDER_EXPERIENCE':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    experience: action.payload,
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'ADD_PROJECT':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    projects: [...state.resumeData.projects, action.payload],
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'UPDATE_PROJECT':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    projects: state.resumeData.projects.map(proj =>
                        proj.id === action.payload.id ? { ...proj, ...action.payload.data } : proj
                    ),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'DELETE_PROJECT':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    projects: state.resumeData.projects.filter(proj => proj.id !== action.payload),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'REORDER_PROJECTS':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    projects: action.payload,
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'ADD_CERTIFICATION':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    certifications: [...state.resumeData.certifications, action.payload],
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'UPDATE_CERTIFICATION':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    certifications: state.resumeData.certifications.map(cert =>
                        cert.id === action.payload.id ? { ...cert, ...action.payload.data } : cert
                    ),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'DELETE_CERTIFICATION':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    certifications: state.resumeData.certifications.filter(cert => cert.id !== action.payload),
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'UPDATE_SOCIAL_LINKS':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    socialLinks: { ...state.resumeData.socialLinks, ...action.payload },
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'SET_TEMPLATE':
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    templateId: action.payload,
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'SET_STEP':
            return {
                ...state,
                currentStep: action.payload,
            };

        case 'MARK_STEP_COMPLETE':
            return {
                ...state,
                completedSteps: state.completedSteps.includes(action.payload)
                    ? state.completedSteps
                    : [...state.completedSteps, action.payload],
            };

        case 'LOAD_RESUME':
            return {
                ...state,
                resumeData: action.payload,
            };

        case 'LOAD_CV': {
            const p = action.payload;
            console.log('LOAD_CV payload:', p);
            
            return {
                ...state,
                resumeData: {
                    ...state.resumeData,
                    personal: {
                        ...state.resumeData.personal,
                        fullName: p.personalInfo?.name || p.name || state.resumeData.personal.fullName || '',
                        jobTitle: p.personalInfo?.title || p.currentRole || p.role || state.resumeData.personal.jobTitle || '',
                        email: p.personalInfo?.email || state.resumeData.personal.email || '',
                        phone: p.personalInfo?.phone || state.resumeData.personal.phone || '',
                        location: p.personalInfo?.location || state.resumeData.personal.location || '',
                        professionalSummary: p.summary || state.resumeData.personal.professionalSummary || ''
                    },
                    socialLinks: {
                        ...state.resumeData.socialLinks,
                        linkedin: p.personalInfo?.linkedin || state.resumeData.socialLinks.linkedin || ''
                    },
                    experience: Array.isArray(p.experience) && p.experience.length > 0
                        ? p.experience.map((exp: any, i: number) => ({
                            id: exp.id || `exp_${i}_${Date.now()}`,
                            role: exp.role || exp.title || '',
                            company: exp.company || '',
                            startDate: exp.startDate || '',
                            endDate: exp.endDate || 'Present',
                            description: exp.description || '',
                            bullets: Array.isArray(exp.bullets) ? exp.bullets : exp.description ? [exp.description] : [],
                            responsibilities: Array.isArray(exp.bullets) ? exp.bullets : exp.description ? [exp.description] : [],
                            current: exp.endDate?.toLowerCase() === 'present',
                            order: i
                        }))
                        : state.resumeData.experience || [],
                    education: Array.isArray(p.education) && p.education.length > 0
                        ? p.education.map((edu: any, i: number) => ({
                            id: edu.id || `edu_${i}_${Date.now()}`,
                            degree: edu.degree || edu.title || '',
                            institution: edu.institution || edu.school || edu.university || '',
                            specialization: edu.degree || '',
                            startDate: '',
                            endDate: edu.year || edu.graduationYear || '',
                            gpa: edu.gpa || '',
                            order: i
                        }))
                        : state.resumeData.education || [],
                    skills: Array.isArray(p.skills) && p.skills.length > 0
                        ? p.skills.map((s: any, i: number) => ({
                            id: `skill_${i}_${Date.now()}`,
                            name: typeof s === 'string' ? s : s.name || '',
                            level: typeof s === 'object' ? s.level || 'intermediate' : 'intermediate',
                            category: 'tools'
                        }))
                        : state.resumeData.skills || [],
                    updatedAt: new Date().toISOString()
                }
            };
        }

        case 'UPDATE_ENTIRE_RESUME':
            return {
                ...state,
                resumeData: {
                    ...action.payload,
                    updatedAt: new Date().toISOString(),
                },
            };

        case 'RESET_RESUME':
            return initialState;

        case 'SET_VALIDATION_ERROR':
            return {
                ...state,
                validationErrors: {
                    ...state.validationErrors,
                    [action.payload.field]: action.payload.error,
                },
            };

        case 'CLEAR_VALIDATION_ERROR':
            const { [action.payload]: _, ...remainingErrors } = state.validationErrors;
            return {
                ...state,
                validationErrors: remainingErrors,
            };

        case 'SET_GAP_REPORT':
            return {
                ...state,
                gapReport: action.payload,
                isAnalyzingGap: false,
            };

        case 'CLEAR_GAP_REPORT':
            return {
                ...state,
                gapReport: null,
                isAnalyzingGap: false,
            };

        case 'SET_GAP_ANALYSIS_LOADING':
            return {
                ...state,
                isAnalyzingGap: action.payload,
            };

        default:
            return state;
    }
}

interface ResumeContextType {
    state: ResumeState;
    dispatch: React.Dispatch<ResumeAction>;
    isFormValid: boolean;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function ResumeProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(resumeReducer, initialState);

    // Compute form validity
    const isFormValid = Object.keys(state.validationErrors).length === 0;

    // Auto-save to localStorage
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('resumeData', JSON.stringify(state.resumeData));
        }, 1000); // Debounce saves by 1 second

        return () => clearTimeout(timer);
    }, [state.resumeData]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('resumeData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                dispatch({ type: 'LOAD_RESUME', payload: data });
            } catch (error) {
                console.error('Failed to load saved resume:', error);
            }
        }
    }, []);

    return (
        <ResumeContext.Provider value={{ state, dispatch, isFormValid }}>
            {children}
        </ResumeContext.Provider>
    );
}

export function useResume() {
    const context = useContext(ResumeContext);
    if (!context) {
        throw new Error('useResume must be used within ResumeProvider');
    }
    return context;
}
