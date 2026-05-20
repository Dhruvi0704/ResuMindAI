"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var recruiterAI_1 = require("../server/lib/recruiterAI");
var dotenv = require("dotenv");
dotenv.config();
var MOCK_JOB_DESCRIPTION = "\nWe are looking for an AI Engineer to join our fast-growing startup.\nYou will be responsible for building predictive models, NLP pipelines, and analyzing large datasets.\nRequired Skills: Python, Machine Learning, Deep Learning, TensorFlow, PyTorch, SQL, AWS, Docker.\nExperience: 3+ years in Data Science or AI roles.\nDegree: Bachelor's or Master's in Computer Science or related field.\n";
var MOCK_RESUME_DATA = {
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
function testDeterminism() {
    return __awaiter(this, void 0, void 0, function () {
        var trial1, trial2, trial3, isDeterministic, modifiedResume, trial4, wrongResume, trial5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("=== Running Determinism Tests ===");
                    // 1. Run exactly identical trials
                    console.log("\\nTest 1: Identical Input Re-Runs");
                    return [4 /*yield*/, (0, recruiterAI_1.evaluateResume)(MOCK_RESUME_DATA, MOCK_JOB_DESCRIPTION, "AI Engineer")];
                case 1:
                    trial1 = _a.sent();
                    return [4 /*yield*/, (0, recruiterAI_1.evaluateResume)(MOCK_RESUME_DATA, MOCK_JOB_DESCRIPTION, "AI Engineer")];
                case 2:
                    trial2 = _a.sent();
                    return [4 /*yield*/, (0, recruiterAI_1.evaluateResume)(MOCK_RESUME_DATA, MOCK_JOB_DESCRIPTION, "AI Engineer")];
                case 3:
                    trial3 = _a.sent();
                    isDeterministic = trial1.candidateScore === trial2.candidateScore &&
                        trial2.candidateScore === trial3.candidateScore;
                    console.log("Trial 1 Score: ".concat(trial1.candidateScore));
                    console.log("Trial 2 Score: ".concat(trial2.candidateScore));
                    console.log("Trial 3 Score: ".concat(trial3.candidateScore));
                    console.log("Result: ".concat(isDeterministic ? "✅ PASS (Perfect Determinism)" : "❌ FAIL"));
                    // 2. Small Change Test (Add one project)
                    console.log("\\nTest 2: Small Increment Sensitivity");
                    modifiedResume = JSON.parse(JSON.stringify(MOCK_RESUME_DATA));
                    modifiedResume.projects.push({
                        title: "TensorFlow Object Detector",
                        description: "Built a real-time object detection system.",
                        techStack: ["TensorFlow", "Computer Vision"]
                    });
                    return [4 /*yield*/, (0, recruiterAI_1.evaluateResume)(modifiedResume, MOCK_JOB_DESCRIPTION, "AI Engineer")];
                case 4:
                    trial4 = _a.sent();
                    console.log("Base Score: ".concat(trial1.candidateScore));
                    console.log("Modified Score: ".concat(trial4.candidateScore));
                    if (Math.abs(trial1.candidateScore - trial4.candidateScore) < 5) {
                        console.log("Result: \u2705 PASS (Score changed by small delta ".concat(trial4.candidateScore - trial1.candidateScore, ")"));
                    }
                    else {
                        console.log("Result: \u274C FAIL (Score changed drastically)");
                    }
                    // 3. Drastic Change Test (Wrong Resume)
                    console.log("\\nTest 3: Wrong Role / Drastic Mismatch");
                    wrongResume = {
                        personal: { fullName: "Jane Doe", jobTitle: "Frontend Developer", professionalSummary: "Building beautiful UIs with React." },
                        experience: [{ role: "UI Developer", company: "Web Co", responsibilities: ["Built React components.", "Styled with Tailwind CSS."] }],
                        education: [{ degree: "Bachelor's", specialization: "Graphic Design" }],
                        projects: [],
                        skills: [{ name: "React" }, { name: "JavaScript" }, { name: "CSS" }]
                    };
                    return [4 /*yield*/, (0, recruiterAI_1.evaluateResume)(wrongResume, MOCK_JOB_DESCRIPTION, "AI Engineer")];
                case 5:
                    trial5 = _a.sent();
                    console.log("AI Engineer Score (Base): ".concat(trial1.candidateScore));
                    console.log("Frontend Dev Score (Wrong): ".concat(trial5.candidateScore));
                    console.log("Confidence Score (Wrong): ".concat(trial5.confidenceScore));
                    if (trial5.candidateScore < 50) {
                        console.log("Result: \u2705 PASS (Wrong resume punished appropriately)");
                    }
                    else {
                        console.log("Result: \u274C FAIL (Wrong resume scored too high)");
                    }
                    console.log("\\n=== Output Validation ===");
                    console.log(JSON.stringify({
                        Score: trial1.candidateScore,
                        Confidence: trial1.confidenceScore,
                        SectionReasons: trial1.sectionReasons
                    }, null, 2));
                    console.log("=== End of Tests ===");
                    return [2 /*return*/];
            }
        });
    });
}
testDeterminism().catch(console.error);
