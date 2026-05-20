import { z } from "zod";

// Helper function to get current year
const currentYear = new Date().getFullYear();

// Personal Information Schema
export const personalInfoSchema = z.object({
    fullName: z
        .string()
        .min(2, "Full name must be at least 2 characters")
        .regex(/^[A-Za-z ]+$/, "Only letters and spaces allowed"),

    jobTitle: z
        .string()
        .min(2, "Job title must be at least 2 characters")
        .regex(/^[A-Za-z ]+$/, "Only letters and spaces allowed"),

    email: z
        .string()
        .min(1, "Email is required")
        .email("Invalid email address"),

    phone: z
        .string()
        .regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits"),

    location: z
        .string()
        .min(2, "Location is required")
        .regex(/^[A-Za-z ,]+$/, "Only letters, spaces, and commas allowed"),

    professionalSummary: z
        .string()
        .min(50, "Summary must be at least 50 characters")
        .max(500, "Summary must not exceed 500 characters")
        .optional()
        .or(z.literal("")),
});

// Education Schema
export const educationSchema = z.object({
    id: z.string(),
    institution: z
        .string()
        .min(2, "Institution name is required")
        .regex(/^[A-Za-z .,&-]+$/, "Only letters, spaces, dots, commas, and hyphens allowed"),

    degree: z
        .string()
        .min(2, "Degree is required")
        .regex(/^[A-Za-z .]+$/, "Only letters, spaces, and dots allowed"),

    specialization: z
        .string()
        .min(2, "Specialization is required")
        .regex(/^[A-Za-z ]+$/, "Only letters and spaces allowed"),

    startDate: z
        .string()
        .regex(/^\d{4}-\d{2}$/, "Invalid date format")
        .refine((date) => {
            const year = parseInt(date.split('-')[0]);
            return year >= 2000 && year <= currentYear + 5;
        }, "Year must be between 2000 and " + (currentYear + 5)),

    endDate: z
        .string()
        .regex(/^\d{4}-\d{2}$/, "Invalid date format")
        .refine((date) => {
            const year = parseInt(date.split('-')[0]);
            return year >= 2000 && year <= currentYear + 5;
        }, "Year must be between 2000 and " + (currentYear + 5)),

    gpa: z
        .string()
        .regex(/^(\d{1}(\.\d{1,2})?)?$/, "Invalid GPA format")
        .optional()
        .or(z.literal("")),

    order: z.number(),
});

// Skills Schema
export const skillSchema = z.object({
    id: z.string(),
    name: z
        .string()
        .min(2, "Skill name must be at least 2 characters")
        .regex(/^[A-Za-z #+.]+$/, "Only letters, spaces, #, +, and dots allowed"),
    category: z.enum(["programming", "frameworks", "tools", "soft"]),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    order: z.number(),
});

// Experience Schema
export const experienceSchema = z.object({
    id: z.string(),
    company: z
        .string()
        .min(2, "Company name is required")
        .regex(/^[A-Za-z0-9 .,&-]+$/, "Only letters, numbers, spaces, and basic punctuation allowed"),

    role: z
        .string()
        .min(2, "Role is required")
        .regex(/^[A-Za-z ]+$/, "Only letters and spaces allowed"),

    startDate: z
        .string()
        .regex(/^\d{4}-\d{2}$/, "Invalid date format"),

    endDate: z
        .string()
        .regex(/^\d{4}-\d{2}$/, "Invalid date format")
        .optional()
        .or(z.literal("")),

    current: z.boolean(),

    responsibilities: z
        .array(z.string().min(10, "Responsibility must be at least 10 characters"))
        .min(1, "At least one responsibility is required"),

    order: z.number(),
});

// Project Schema
export const projectSchema = z.object({
    id: z.string(),
    title: z
        .string()
        .min(3, "Project title must be at least 3 characters")
        .regex(/^[A-Za-z0-9 -]+$/, "Only letters, numbers, spaces, and hyphens allowed"),

    description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(500, "Description must not exceed 500 characters"),

    techStack: z
        .array(z.string())
        .min(1, "At least one technology is required"),

    githubUrl: z
        .string()
        .url("Invalid URL")
        .startsWith("https://", "URL must start with https://")
        .optional()
        .or(z.literal("")),

    liveUrl: z
        .string()
        .url("Invalid URL")
        .startsWith("https://", "URL must start with https://")
        .optional()
        .or(z.literal("")),

    order: z.number(),
});

// Certification Schema
export const certificationSchema = z.object({
    id: z.string(),
    name: z
        .string()
        .min(3, "Certification name is required")
        .regex(/^[A-Za-z0-9 .:&-]+$/, "Only letters, numbers, spaces, and basic punctuation allowed"),

    issuer: z
        .string()
        .min(2, "Issuer is required")
        .regex(/^[A-Za-z0-9 .,&-]+$/, "Only letters, numbers, spaces, and basic punctuation allowed"),

    date: z
        .string()
        .regex(/^\d{4}-\d{2}$/, "Invalid date format"),

    order: z.number(),
});

// Social Links Schema
export const socialLinksSchema = z.object({
    linkedin: z
        .string()
        .url("Invalid LinkedIn URL")
        .startsWith("https://", "URL must start with https://")
        .optional()
        .or(z.literal("")),

    github: z
        .string()
        .url("Invalid GitHub URL")
        .startsWith("https://", "URL must start with https://")
        .optional()
        .or(z.literal("")),

    portfolio: z
        .string()
        .url("Invalid Portfolio URL")
        .startsWith("https://", "URL must start with https://")
        .optional()
        .or(z.literal("")),

    leetcode: z
        .string()
        .url("Invalid LeetCode URL")
        .startsWith("https://", "URL must start with https://")
        .optional()
        .or(z.literal("")),

    kaggle: z
        .string()
        .url("Invalid Kaggle URL")
        .startsWith("https://", "URL must start with https://")
        .optional()
        .or(z.literal("")),

    twitter: z
        .string()
        .url("Invalid Twitter URL")
        .startsWith("https://", "URL must start with https://")
        .optional()
        .or(z.literal("")),
});

// Complete Resume Schema
export const resumeSchema = z.object({
    personal: personalInfoSchema,
    education: z.array(educationSchema),
    skills: z.array(skillSchema),
    experience: z.array(experienceSchema),
    projects: z.array(projectSchema),
    certifications: z.array(certificationSchema),
    socialLinks: socialLinksSchema,
});

// Export types
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type EducationFormData = z.infer<typeof educationSchema>;
export type SkillFormData = z.infer<typeof skillSchema>;
export type ExperienceFormData = z.infer<typeof experienceSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type CertificationFormData = z.infer<typeof certificationSchema>;
export type SocialLinksFormData = z.infer<typeof socialLinksSchema>;
export type ResumeFormData = z.infer<typeof resumeSchema>;
