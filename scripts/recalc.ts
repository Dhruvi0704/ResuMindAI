import "dotenv/config";
import { storage } from "../server/storage.ts";
import { generateOverallFeedback } from "../server/lib/interviewAI.ts";
import { db } from "../server/db.ts";
import { mockInterviews } from "../shared/schema.ts";

async function run() {
    console.log("Fetching all interviews...");
    const interviews = await db.select().from(mockInterviews);
    if (!interviews.length) {
        console.error("No interviews in db!");
        return process.exit(1);
    }
    
    // Get the most recent one
    interviews.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    const latest = interviews[0];
    const interviewId = latest.id;
    
    console.log(`Using latest interview ID: ${interviewId}`);
    
    const interview = await storage.getMockInterview(interviewId);
    if (!interview) {
        console.error("Interview not found!");
        return process.exit(1);
    }
    
    const answers = await storage.getInterviewAnswers(interviewId);
    const questions = await storage.getInterviewQuestions(interviewId);
    
    console.log(`Found ${answers.length} answers.`);
    if (answers.length === 0) {
        console.error("No answers for this interview!");
        return process.exit(1);
    }
    
    const qAndA = answers.map(a => {
        const q = questions.find(q => q.id === a.questionId);
        return {
            question: q?.question || "",
            answer: a.userAnswer,
            score: parseInt(a.score || "0"),
            aiFeedback: a.aiFeedback || ""
        };
    });

    console.log("Generating overall feedback with recommendations...");
    const overall = await generateOverallFeedback(
        interview.jobTitle,
        interview.roundType,
        qAndA
    );
    
    console.log("Generated feedback:", JSON.stringify(overall, null, 2));
    
    // Force the mathematically correct average
    const calcAverage = (answers.reduce((sum, a) => sum + (parseFloat(a.score || "0") || 0), 0) / answers.length).toFixed(1);
    if (overall.overall_scores) {
        overall.overall_scores.overall_interview = parseFloat(calcAverage);
    }
    
    await storage.updateMockInterview(interviewId, {
        feedback: JSON.stringify(overall)
    });
    
    console.log("Database updated successfully!");
    process.exit(0);
}

run().catch(console.error);
