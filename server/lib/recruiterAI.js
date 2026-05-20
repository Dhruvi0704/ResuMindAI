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
exports.evaluateResume = evaluateResume;
exports.improveResumeForJob = improveResumeForJob;
var generative_ai_1 = require("@google/generative-ai");
var matchingUtils_1 = require("./matchingUtils");
var skillOntology_1 = require("./skillOntology");
var apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}
var genAI;
try {
    genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
}
catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
}
var getModel = function () { return genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); };
// In-Memory Cache to guarantee identical results
var evaluationCache = new Map();
/**
 * Calculates a probabilistic score for hiring based on Candidate Score
 */
function calculateProbabilities(score) {
    if (score >= 90)
        return { interview: 85, offer: 60 };
    if (score >= 80)
        return { interview: 70, offer: 45 };
    if (score >= 70)
        return { interview: 50, offer: 30 };
    if (score >= 60)
        return { interview: 30, offer: 15 };
    if (score >= 50)
        return { interview: 15, offer: 5 };
    return { interview: 5, offer: 0 };
}
/**
 * Rule-based resume quality detection
 */
function calculateQualityScore(resumeData) {
    var _a, _b;
    var score = 0;
    var reasons = [];
    // Check section existence
    if (((_b = (_a = resumeData.personal) === null || _a === void 0 ? void 0 : _a.professionalSummary) === null || _b === void 0 ? void 0 : _b.length) > 50)
        score += 20;
    var totalBullets = 0;
    var actionVerbs = 0;
    var actionVerbList = ['developed', 'led', 'designed', 'built', 'managed', 'created', 'implemented', 'optimized', 'reduced', 'increased'];
    if (Array.isArray(resumeData.experience)) {
        score += 20; // Experience exists
        resumeData.experience.forEach(function (exp) {
            var responsibilities = Array.isArray(exp.responsibilities) ? exp.responsibilities : [exp.responsibilities].filter(Boolean);
            totalBullets += responsibilities.length;
            responsibilities.forEach(function (r) {
                var text = r.toLowerCase();
                if (actionVerbList.some(function (v) { return text.includes(v); }))
                    actionVerbs++;
            });
        });
    }
    if (totalBullets >= 3)
        score += 20;
    if (actionVerbs >= 2)
        score += 20;
    if (Array.isArray(resumeData.skills) && resumeData.skills.length > 3)
        score += 10;
    if (Array.isArray(resumeData.education) && resumeData.education.length > 0)
        score += 10;
    return Math.min(100, Math.max(0, score));
}
function extractTextField(resumeData, field) {
    if (!resumeData || !resumeData[field])
        return "";
    if (Array.isArray(resumeData[field])) {
        return resumeData[field].map(function (f) { return JSON.stringify(f); }).join(" ");
    }
    return JSON.stringify(resumeData[field]);
}
/**
 * Evaluates a resume against a job description deterministically simulating an AI Recruiter.
 */
function evaluateResume(resumeData, jobDescription, targetJobTitle) {
    return __awaiter(this, void 0, void 0, function () {
        var payloadStr, cacheKey, requiredSkills, fullResumeText, possessedSkills, matchedSkills, missingSkills, skillsMatchScore, expText, expTfIdf, expSemantic, experienceRelevanceScore, projText, projTfIdf, projSemantic, projectRelevanceScore, eduText, jdText, educationAlignmentScore, resumeQualityScore, atsKeywordMatchPercentage, rawScore, candidateScore, confidenceScore, probs, model, prompt, llmOutputs, result, response, text, parsed, err_1, finalResult;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    payloadStr = JSON.stringify(resumeData) + jobDescription + targetJobTitle;
                    cacheKey = (0, matchingUtils_1.generateHash)(payloadStr);
                    if (evaluationCache.has(cacheKey)) {
                        return [2 /*return*/, evaluationCache.get(cacheKey)];
                    }
                    requiredSkills = (0, skillOntology_1.extractRecognizedSkills)(jobDescription);
                    fullResumeText = "\n    ".concat(((_a = resumeData.personal) === null || _a === void 0 ? void 0 : _a.professionalSummary) || "", "\n    ").concat(extractTextField(resumeData, "experience"), "\n    ").concat(extractTextField(resumeData, "projects"), "\n    ").concat(Array.isArray(resumeData.skills) ? resumeData.skills.join(" ") : "", "\n  ");
                    possessedSkills = (0, skillOntology_1.extractRecognizedSkills)(fullResumeText);
                    matchedSkills = requiredSkills.filter(function (s) { return possessedSkills.includes(s); });
                    missingSkills = requiredSkills.filter(function (s) { return !possessedSkills.includes(s); });
                    skillsMatchScore = requiredSkills.length > 0
                        ? (matchedSkills.length / requiredSkills.length) * 100
                        : 75;
                    expText = extractTextField(resumeData, "experience");
                    expTfIdf = (0, matchingUtils_1.calculateTFIDFSimilarity)(expText, jobDescription) * 100;
                    return [4 /*yield*/, (0, matchingUtils_1.getSemanticSimilarity)(expText, jobDescription)];
                case 1:
                    expSemantic = (_b.sent()) * 100;
                    experienceRelevanceScore = Math.min(100, (expTfIdf * 0.4) + (expSemantic * 0.6));
                    projText = extractTextField(resumeData, "projects");
                    projTfIdf = (0, matchingUtils_1.calculateTFIDFSimilarity)(projText, jobDescription) * 100;
                    return [4 /*yield*/, (0, matchingUtils_1.getSemanticSimilarity)(projText, jobDescription)];
                case 2:
                    projSemantic = (_b.sent()) * 100;
                    projectRelevanceScore = Math.min(100, (projTfIdf * 0.4) + (projSemantic * 0.6));
                    if (!projText || projText.trim() === "[]")
                        projectRelevanceScore = 0; // Penalty for no projects
                    eduText = (0, skillOntology_1.normalizeText)(extractTextField(resumeData, "education"));
                    jdText = (0, skillOntology_1.normalizeText)(jobDescription);
                    educationAlignmentScore = 40;
                    if (eduText.includes("bachelor") || eduText.includes("master") || eduText.includes("phd") || eduText.includes("bs") || eduText.includes("ms")) {
                        educationAlignmentScore = 70; // Related degree
                    }
                    // Check if JD mentions degree and we have it
                    if (jdText.includes("computer science") && eduText.includes("computer science")) {
                        educationAlignmentScore = 100; // Exact match
                    }
                    resumeQualityScore = calculateQualityScore(resumeData);
                    atsKeywordMatchPercentage = skillsMatchScore;
                    rawScore = ((skillsMatchScore * 0.35) +
                        (experienceRelevanceScore * 0.25) +
                        (projectRelevanceScore * 0.20) +
                        (educationAlignmentScore * 0.10) +
                        (resumeQualityScore * 0.10));
                    candidateScore = Math.round(Math.min(100, Math.max(0, rawScore)));
                    confidenceScore = 90;
                    if (fullResumeText.length < 500)
                        confidenceScore -= 20;
                    if (Math.abs(expTfIdf - expSemantic) > 40)
                        confidenceScore -= 10;
                    if (resumeQualityScore < 40)
                        confidenceScore -= 15;
                    confidenceScore = Math.max(0, Math.min(100, confidenceScore));
                    probs = calculateProbabilities(candidateScore);
                    model = genAI.getGenerativeModel({
                        model: "gemini-2.5-flash",
                        // Force generation of structured data with minimal variability
                        generationConfig: {
                            temperature: 0,
                            responseMimeType: "application/json"
                        }
                    });
                    prompt = "\nYou are an expert AI Tech Recruiter. The resume has already been algorithmically scored.\nDO NOT recalculate the scores.\nYour ONLY job is to write 1-2 sentence short human-readable explanations, strengths, and weaknesses based ON THE PROVIDED SCORES.\n\nScores Provided:\n- Skills Match: ".concat(Math.round(skillsMatchScore), "%\n- Experience Match: ").concat(Math.round(experienceRelevanceScore), "%\n- Projects Match: ").concat(Math.round(projectRelevanceScore), "%\n- Target Job: ").concat(targetJobTitle, "\n- Candidate Overall Score: ").concat(candidateScore, " / 100\n\nMatched Skills: ").concat(matchedSkills.join(", "), "\nMissing Skills: ").concat(missingSkills.slice(0, 5).join(", "), "\n\nGenerate ONLY a JSON object matching this schema exactly:\n{\n  \"strengths\": [\"string\", \"string\", \"string\"], (max 3, based on what scored high)\n  \"weaknesses\": [\"string\", \"string\", \"string\"], (max 3, based on what scored low)\n  \"hiringRecommendation\": \"A short 1-sentence recommendation based on the score\",\n  \"sectionReasons\": {\n    \"skills\": \"Reason for skill score (e.g., 'Matched 5/8 required skills.')\",\n    \"experience\": \"Reason for experience score\",\n    \"projects\": \"Reason for project score\"\n  }\n}\n");
                    llmOutputs = {
                        strengths: ["Strong technical foundations"],
                        weaknesses: ["Missing some specialized skills"],
                        hiringRecommendation: "Consider candidate based on individual fit.",
                        sectionReasons: {
                            skills: "Matched ".concat(matchedSkills.length, " of ").concat(requiredSkills.length, " required skills."),
                            experience: "Experience alignment determined by semantic analysis.",
                            projects: "Project relevance determined by text similarity."
                        }
                    };
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, model.generateContent(prompt)];
                case 4:
                    result = _b.sent();
                    return [4 /*yield*/, result.response];
                case 5:
                    response = _b.sent();
                    text = response.text();
                    parsed = JSON.parse(text);
                    if (parsed.strengths)
                        llmOutputs = parsed;
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _b.sent();
                    console.error("LLM reasoning generation failed, using fallbacks.", err_1);
                    return [3 /*break*/, 7];
                case 7:
                    finalResult = {
                        candidateScore: candidateScore,
                        confidenceScore: confidenceScore,
                        skillsMatchScore: Math.round(skillsMatchScore),
                        experienceRelevanceScore: Math.round(experienceRelevanceScore),
                        projectRelevanceScore: Math.round(projectRelevanceScore),
                        educationAlignmentScore: Math.round(educationAlignmentScore),
                        resumeQualityScore: Math.round(resumeQualityScore),
                        atsKeywordMatchPercentage: Math.round(atsKeywordMatchPercentage),
                        strengths: llmOutputs.strengths || [],
                        weaknesses: llmOutputs.weaknesses || [],
                        hiringRecommendation: llmOutputs.hiringRecommendation || "",
                        interviewChance: probs.interview,
                        offerProbability: probs.offer,
                        skillGaps: missingSkills.slice(0, 5),
                        sectionReasons: llmOutputs.sectionReasons
                    };
                    // Cache result
                    evaluationCache.set(cacheKey, finalResult);
                    return [2 /*return*/, finalResult];
            }
        });
    });
}
/**
 * Improves the resume formData content to better match the given job description.
 */
function improveResumeForJob(resumeData, jobDescription, targetJobTitle) {
    return __awaiter(this, void 0, void 0, function () {
        var model, prompt, result, response, text, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    model = getModel();
                    prompt = "\nYou are an expert Resume Writer and AI Auto-optimizer.\nThe user wants to tailor their current resume to perfectly match a specific Job Description.\n\nTarget Job Title: ".concat(targetJobTitle, "\n\nJob Description:\n").concat(jobDescription, "\n\nCurrent Resume Data (JSON format):\n").concat(JSON.stringify(resumeData, null, 2), "\n\nYour task is to REWRITE and ENHANCE the following parts of the resume data to align with the keywords and requirements in the Job Description, without fabricating past job titles or companies:\n- `personal.professionalSummary`: Rewrite the professional summary to highlight relevance to the JD.\n- `experience`: Rewrite the `responsibilities` array for each experience to emphasize achievements relevant to the JD, using strong action verbs and metrics.\n- `projects`: Enhance the `description` and `techStack` fields.\n- `skills`: Reorder or add implicitly possessed skills (if applicable based on experience) to match the Job Description requirements.\n\nReturn the FULL updated Resume Data object in the exact same JSON structure.\nDo not include markdown blocks like ```json. Return just the raw JSON.\n");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, model.generateContent({
                            contents: [{ role: "user", parts: [{ text: prompt }] }],
                            generationConfig: {
                                responseMimeType: "application/json",
                            }
                        })];
                case 2:
                    result = _a.sent();
                    return [4 /*yield*/, result.response];
                case 3:
                    response = _a.sent();
                    text = response.text();
                    return [2 /*return*/, JSON.parse(text)];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error improving resume with Gemini:", error_1);
                    throw new Error("Failed to auto-improve resume.");
                case 5: return [2 /*return*/];
            }
        });
    });
}
