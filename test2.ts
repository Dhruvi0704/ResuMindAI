import "dotenv/config";
import { improveResumeForJob } from "./server/lib/recruiterAI.ts";

const mockResume = {
  personal: {
    fullName: "John Doe",
    jobTitle: "Software Engineer",
    email: "john@example.com",
    phone: "1234567890",
    location: "Remote",
    professionalSummary: "Experienced engineer."
  },
  experience: [
    { role: "Developer", company: "Tech Inc", startDate: "2020", endDate: "2023", responsibilities: ["Wrote code."] }
  ],
  projects: [],
  skills: ["React", "TypeScript"],
  education: [],
  certifications: [],
  socialLinks: {}
};

const jd = "Looking for a Senior React Developer with TypeScript experience.";
const jobTitle = "Senior React Developer";

async function main() {
  try {
    const start = Date.now();
    console.log("Calling improveResumeForJob...");
    const result = await improveResumeForJob(mockResume, jd, jobTitle);
    console.log("RESULT:", JSON.stringify(result, null, 2));
    console.log("Time (ms):", Date.now() - start);
  } catch (e) {
    console.error("TEST SCRIPT ERROR:", e);
  }
}

main();
