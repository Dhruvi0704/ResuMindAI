import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, jsonb, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().email("Invalid email address"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const userProfiles = pgTable('user_profiles', {
  id: varchar('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  plan: text('plan').default('free'),
  targetJobRole: text('target_job_role'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const cvDocuments = pgTable('cv_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  cvName: text('cv_name').notNull(),
  cvData: jsonb('cv_data').notNull(),
  templateConfig: jsonb('template_config'),
  isDefault: boolean('is_default').default(false),
  lastSaved: timestamp('last_saved').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});
export const insertCvDocumentSchema = createInsertSchema(cvDocuments);
export type CvDocument = typeof cvDocuments.$inferSelect;
export type InsertCvDocument = z.infer<typeof insertCvDocumentSchema>;

export const cvAnalyses = pgTable('cv_analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  cvDocumentId: uuid('cv_document_id').references(() => cvDocuments.id),
  fileName: text('file_name'),
  targetRole: text('target_role').notNull(),
  overallScore: integer('overall_score'),
  atsScore: integer('ats_score'),
  interviewChance: integer('interview_chance'),
  analysisData: jsonb('analysis_data').notNull(),
  extractedText: text('extracted_text'),
  createdAt: timestamp('created_at').defaultNow()
});

export const atsEvaluations = pgTable('ats_evaluations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  cvDocumentId: uuid('cv_document_id').references(() => cvDocuments.id),
  jobDescription: text('job_description').notNull(),
  targetRole: text('target_role'),
  candidateScore: real('candidate_score'),
  atsKeywordScore: real('ats_keyword_score'),
  skillsMatchScore: real('skills_match_score'),
  experienceScore: real('experience_score'),
  educationScore: real('education_score'),
  projectsScore: real('projects_score'),
  domainMatchPct: real('domain_match_pct'),
  penaltyApplied: boolean('penalty_applied').default(false),
  interviewChance: real('interview_chance'),
  offerProbability: real('offer_probability'),
  evaluationData: jsonb('evaluation_data').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const cvImprovements = pgTable('cv_improvements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  cvDocumentId: uuid('cv_document_id').references(() => cvDocuments.id),
  originalCvData: jsonb('original_cv_data').notNull(),
  improvedCvData: jsonb('improved_cv_data').notNull(),
  targetRole: text('target_role'),
  jobDescription: text('job_description'),
  improvementSummary: text('improvement_summary'),
  createdAt: timestamp('created_at').defaultNow()
});

export const mockInterviews = pgTable('mock_interviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  targetRole: text('target_role').notNull(),
  questions: jsonb('questions').notNull(),
  answers: jsonb('answers').notNull(),
  scores: jsonb('scores').notNull(),
  overallScore: real('overall_score'),
  feedback: text('feedback'),
  duration: integer('duration_seconds'),
  createdAt: timestamp('created_at').defaultNow()
});
export const insertMockInterviewSchema = createInsertSchema(mockInterviews);
export type MockInterview = typeof mockInterviews.$inferSelect;
export type InsertMockInterview = z.infer<typeof insertMockInterviewSchema>;

export const gapAnalyses = pgTable('gap_analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  cvDocumentId: uuid('cv_document_id').references(() => cvDocuments.id),
  jobDescription: text('job_description').notNull(),
  overallMatch: integer('overall_match'),
  domainMatchPct: integer('domain_match_pct'),
  penaltyApplied: boolean('penalty_applied'),
  sectionsData: jsonb('sections_data').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
export const insertGapReportSchema = createInsertSchema(gapAnalyses);
export type GapReport = typeof gapAnalyses.$inferSelect;
export type InsertGapReport = z.infer<typeof insertGapReportSchema>;

export const activityLog = pgTable('activity_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow()
});

export const interviewQuestions = pgTable("interview_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  interviewId: varchar("interview_id").notNull(),
  question: text("question").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  modelAnswer: text("model_answer"),
  order: text("order").notNull(),
});
export const insertInterviewQuestionSchema = createInsertSchema(interviewQuestions);
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = z.infer<typeof insertInterviewQuestionSchema>;

export const interviewAnswers = pgTable("interview_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull(),
  userAnswer: text("user_answer").notNull(),
  aiFeedback: text("ai_feedback"),
  score: text("score"),
  timeTaken: text("time_taken"),
});
export const insertInterviewAnswerSchema = createInsertSchema(interviewAnswers);
export type InterviewAnswer = typeof interviewAnswers.$inferSelect;
export type InsertInterviewAnswer = z.infer<typeof insertInterviewAnswerSchema>;

export const resumes = pgTable("resumes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull().default("My Resume"),
  content: text("content").notNull(),
  templateId: text("template_id").notNull().default("minimal"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertResumeSchema = createInsertSchema(resumes);
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
