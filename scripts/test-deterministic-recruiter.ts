process.on('uncaughtException', err => console.error("CRITICAL UNCAUGHT", err));
process.on('unhandledRejection', err => console.error("CRITICAL REJECTION", err));

import { evaluateResume, RecruiterEvaluationResult } from "../server/lib/recruiterAI";
dotenv.config();

const MOCK_JOB_DESCRIPTION = "We are looking for an AI Engineer to join our fast-growing startup.\\nYou will be responsible for building predictive models, NLP pipelines, and analyzing large datasets.\\nRequired Skills: Python, Machine Learning, Deep Learning, TensorFlow, PyTorch, SQL, AWS, Docker.\\nExperience: 3+ years in Data Science or AI roles.\\nDegree: Bachelor's or Master's in Computer Science or related field.";

const MOCK_RESUME_DATA = {
  personal: {
    fullName: "John AI Developer",
    jobTitle: "Machine Learning Engineer",
    professionalSummary: "Experienced Machine Learning Engineer with 4 years of experience building and deploying scalable AI models. Passionate about solving complex problems using Deep Learning and NLP.",
  },
  experience: [
    {
      role: "AI Researcher",
      company: "Tech Corp",
      startDate: "2020",
      endDate: "2024",
      responsibilities: [
        "Developed and optimized custom NLP models using PyTorch.",
        "Led a team of 3 engineers to build a scalable recommendation engine.",
        "Deployed machine learning models to AWS via Docker containers."
      ]
    }
  ],
  education: [
    {
      degree: "Master's",
      specialization: "Computer Science",
      institution: "State University",
      startDate: "2018",
      endDate: "2020",
    }
  ],
  projects: [
    {
      title: "Sentiment Analysis API",
      description: "Built a REST API for sentiment analysis using transformers and FastAPI.",
      techStack: ["Python", "FastAPI", "Transformers", "Docker"]
    }
  ],
  skills: [
    { name: "Python" },
    { name: "PyTorch" },
    { name: "Machine Learning" },
    { name: "Deep Learning" },
    { name: "SQL" },
    { name: "AWS" },
    { name: "Docker" }
  ]
};

async function testDeterminism() {
  console.log("=== Running Determinism Tests ===");
  const results: any = {};

  const t1 = await evaluateResume(MOCK_RESUME_DATA, MOCK_JOB_DESCRIPTION, "AI Engineer");
  const t2 = await evaluateResume(MOCK_RESUME_DATA, MOCK_JOB_DESCRIPTION, "AI Engineer");
  
  if (t1.candidateScore === t2.candidateScore) {
     results.Test1 = "PASS: Determinism Guaranteed " + t1.candidateScore;
  } else {
     results.Test1 = "FAIL: " + t1.candidateScore + " vs " + t2.candidateScore;
  }

  const modResume = JSON.parse(JSON.stringify(MOCK_RESUME_DATA));
  modResume.projects.push({ title: "New Project", description: "did stuff", techStack: ["Python"] });
  
  const t3 = await evaluateResume(modResume, MOCK_JOB_DESCRIPTION, "AI Engineer");
  results.Test2 = "Mod score is " + t3.candidateScore + " (base was " + t1.candidateScore + ")";

  const wrong = {
    personal: { fullName: "Jane", jobTitle: "UI", professionalSummary: "UI/UX React" },
    experience: [],
    education: [],
    projects: [],
    skills: [{ name: "React" }]
  };
  
  const t4 = await evaluateResume(wrong, MOCK_JOB_DESCRIPTION, "AI Engineer");
  results.Test3 = "Wrong resume scored " + t4.candidateScore + " with confidence " + t4.confidenceScore;
  
  require('fs').writeFileSync('deterministic_test_out.json', JSON.stringify(results, null, 2));
  console.log("Done.");
}

testDeterminism().catch(console.error);
