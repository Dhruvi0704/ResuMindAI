import {
  type User, type InsertUser,
  type InterviewQuestion, type InsertInterviewQuestion,
  type InterviewAnswer, type InsertInterviewAnswer,
  type Resume, type InsertResume,
  users, interviewQuestions, interviewAnswers, resumes
} from "../shared/schema.ts";
import { db } from "./db.ts";
import { eq, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createInterviewQuestions(questions: InsertInterviewQuestion[]): Promise<InterviewQuestion[]>;
  getInterviewQuestions(interviewId: string): Promise<InterviewQuestion[]>;

  addInterviewAnswer(answer: InsertInterviewAnswer): Promise<InterviewAnswer>;
  getInterviewAnswers(interviewId: string): Promise<InterviewAnswer[]>;

  // Resume CRUD
  getResumesByUserId(userId: string): Promise<Resume[]>;
  createResume(resume: InsertResume): Promise<Resume>;
  getResume(id: string): Promise<Resume | undefined>;
  updateResume(id: string, updates: Partial<Resume>): Promise<Resume>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      username: insertUser.username,
      name: insertUser.name
    }).returning();
    return user;
  }

  async createInterviewQuestions(questions: InsertInterviewQuestion[]): Promise<InterviewQuestion[]> {
    const created = await db.insert(interviewQuestions).values(questions).returning();
    return created;
  }

  async getInterviewQuestions(interviewId: string): Promise<InterviewQuestion[]> {
    const result = await db.select().from(interviewQuestions).where(eq(interviewQuestions.interviewId, interviewId));
    return result.sort((a, b) => parseInt(a.order) - parseInt(b.order));
  }

  async addInterviewAnswer(answer: InsertInterviewAnswer): Promise<InterviewAnswer> {
    const [newAnswer] = await db.insert(interviewAnswers).values(answer).returning();
    return newAnswer;
  }

  async getInterviewAnswers(interviewId: string): Promise<InterviewAnswer[]> {
    const questions = await this.getInterviewQuestions(interviewId);
    if (questions.length === 0) return [];

    const questionIds = questions.map(q => q.id);
    const answers = await db.select().from(interviewAnswers).where(inArray(interviewAnswers.questionId, questionIds));
    return answers;
  }

  // Resume CRUD
  async getResumesByUserId(userId: string): Promise<Resume[]> {
    return await db.select().from(resumes).where(eq(resumes.userId, userId));
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const [newResume] = await db.insert(resumes).values(resume).returning();
    return newResume;
  }

  async getResume(id: string): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume;
  }

  async updateResume(id: string, updates: Partial<Resume>): Promise<Resume> {
    const [resume] = await db.update(resumes)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(resumes.id, id))
      .returning();
    if (!resume) throw new Error("Resume not found");
    return resume;
  }
}

export const storage = new DatabaseStorage();
