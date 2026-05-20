import { generateInterviewQuestions } from "./server/lib/interviewAI.ts";

async function main() {
    try {
        console.log("Testing generateInterviewQuestions...");
        const qs = await generateInterviewQuestions({
            jobTitle: "Software Engineer",
            experienceLevel: "Mid-Level",
            questionCount: 2
        });
        console.log("Success!");
        console.log(qs);
    } catch (e) {
        console.error("Test failed:", e);
    }
}

main();
