// @ts-ignore
import { generateInterviewQuestions } from "./server/lib/interviewAI.ts";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Starting generation...");
        const result = await generateInterviewQuestions({
            jobTitle: "Ai Engineer",
            experienceLevel: "Fresher (0-1 years)",
            jobDescription: "Python",
            roundType: "Technical Round"
        });
        console.log("SUCCESS:", result);
    } catch (e) {
        console.error("FAILED:", e);
    }
}

main();
