import { GoogleGenerativeAI } from "@google/generative-ai";
import { callWithRetry } from "./gemini";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

export interface InterviewQuestionConfig {
    jobTitle: string;
    experienceLevel: string;
    jobDescription?: string;
    questionCount?: number;
    roundType?: string;
}

export interface GeneratedQuestion {
    question: string;
    category: string;
    difficulty: "Easy" | "Medium" | "Hard";
    modelAnswer: string;
}

export async function generateInterviewQuestions({
    jobTitle,
    experienceLevel,
    jobDescription = "",
    questionCount = 5,
    roundType = "Technical Round"
}: InterviewQuestionConfig): Promise<GeneratedQuestion[]> {


    const prompt = `
    You are an expert Interviewer at a top-tier company.
    Generate a set of ${questionCount} interview questions for a ${experienceLevel} ${jobTitle} candidate.
    
    ${jobDescription ? `Job Description: ${jobDescription}\n` : ""}
    Interview Round Type: ${roundType}
    
    The questions MUST be specifically tailored to the Interview Round Type:
    - If "Technical Round": Focus on technical knowledge, problem-solving, algorithms, frameworks, and system understanding.
    - If "Semi-Technical Round": Focus on practical application, project experience, tools/workflows, debugging, and collaboration.
    - If "HR Round": Focus on behavioral questions, personality, communication skills, teamwork, and career vision. Include questions evaluating their interest in the AI/ML field and project experience. Use questions like these for inspiration:
       * "Tell me about yourself and what motivated you to pursue a career in Artificial Intelligence or Machine Learning."
       * "How do you keep yourself updated with the latest advancements in AI and machine learning technologies?"
       * "Can you describe a project where you used AI or machine learning? What challenges did you face and how did you overcome them?"
       * "How do you approach teamwork and collaboration in technical projects involving data engineers, developers, and product teams?"
       * "Where do you see yourself in the next 3-5 years in the field of AI, and what skills are you currently working on?"
    
    For each question, provide:
    1. The Question itself.
    2. Category (set this exactly to the Round Type, do not invent new categories like "Behavioral" or "Situational").
    3. Difficulty (Easy, Medium, Hard).
    4. A concise Model Answer summary (what to look for).

    Return the response as a VALID JSON array of objects.
    Format:
    [
      {
        "question": "string",
        "category": "string",
        "difficulty": "Easy" | "Medium" | "Hard",
        "modelAnswer": "string"
      }
    ]
    Do not include markdown backticks like \`\`\`json. Just the raw JSON.
  `;

    try {
        const response = await callWithRetry(prompt);
        const text = response.text();

        // Cleanup markdown if present
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const questions = JSON.parse(cleanedText) as GeneratedQuestion[];
        return questions;
    } catch (error: any) {
        console.error("Error generating interview questions:", error);
        throw new Error("Failed to generate interview questions: " + (error.message || error.toString()));
    }
}

export interface QuestionFeedback {
    question: string;
    candidate_answer: string;
    summary_feedback: string;
    strengths: string[];
    areas_for_improvement: string[];
    speaking_analysis: {
        tone: string;
        confidence: string;
        pauses: string;
        fluency: string;
        speaking_speed: string;
        filler_words: string;
    };
    scores: {
        knowledge: number;
        communication: number;
        confidence: number;
        clarity: number;
        overall: number;
    };
    improvement_tips: string[];
    ideal_answer_comparison: {
        ideal_answer: string;
        similarity_score_percentage: number;
        candidate_score_out_of_10: number;
        covered_concepts: string[];
        missing_concepts: string[];
        evaluation_feedback: {
            strengths: string[];
            areas_for_improvement: string[];
        };
    };
}

export async function evaluateInterviewAnswer(
    jobTitle: string,
    experienceLevel: string,
    jobDescription: string,
    question: string,
    userAnswer: string,
    roundType: string,
    modelAnswer?: string
): Promise<QuestionFeedback | null> {
    if (!question || !userAnswer) return null;

    if (userAnswer.trim().length < 5 || userAnswer.toLowerCase() === "i don't know") {
        return {
            question,
            candidate_answer: userAnswer,
            summary_feedback: "The answer provided was essentially blank or too short to analyze.",
            strengths: [],
            areas_for_improvement: ["You need to attempt to provide an answer to demonstrate your knowledge."],
            speaking_analysis: {
                tone: "N/A", confidence: "0%", pauses: "N/A", fluency: "Poor", speaking_speed: "N/A", filler_words: "N/A"
            },
            scores: { knowledge: 0, communication: 0, confidence: 0, clarity: 0, overall: 0 },
            improvement_tips: ["Ensure you always attempt to answer the question, even if you are unsure."],
            ideal_answer_comparison: {
                ideal_answer: "N/A - No attempt was made.",
                similarity_score_percentage: 0,
                candidate_score_out_of_10: 0,
                covered_concepts: [],
                missing_concepts: ["The candidate did not attempt the question."],
                evaluation_feedback: {
                    strengths: [],
                    areas_for_improvement: ["Attempt to provide an answer, even if partial."]
                }
            }
        };
    }



    const prompt = `
    You are an expert Interviewer evaluating a candidate's answer for a ${roundType}.
    Context:
    - Job Title: ${jobTitle}
    - Experience Level: ${experienceLevel}
    - Job Description: ${jobDescription || "Not provided"}
    
    Question: "${question}"
    Candidate's Answer: "${userAnswer}"
    ${modelAnswer ? `Suggested Model Answer: "${modelAnswer}"` : ""}
    
    STEP 1: GENERATE IDEAL ANSWER
    Generate an ideal answer conceptually representing how a strong candidate would respond based on the Job Title, Experience Level, and Round Type.

    STEP 2: ADAPT EVALUATION BASED ON ROUND TYPE
    - TECHNICAL ROUND (or if it's mostly technical): evaluate correctness of technical concepts, accuracy of explanation, use of technical terminology, and completeness.
    - SEMI-TECHNICAL ROUND: evaluate practical understanding, explanation of workflow, tools or technologies used, and problem-solving approach.
    - HR / COMMON ROUND (or non-technical): evaluate communication clarity, structured response, relevance to the question, and professional tone.

    STEP 3: SIMILARITY ANALYSIS
    Compare the Candidate's Answer with the Ideal Answer using semantic similarity techniques (concept matching, keyword coverage). Calculate a 'similarity_score_percentage' (0-100).

    STEP 4: CONCEPT COVERAGE ANALYSIS
    Extract key concepts from the Ideal Answer. Classify them into:
    - covered_concepts: Concepts mentioned by the candidate.
    - missing_concepts: Important points missing from the candidate answer.

    STEP 5: ANSWER SCORING
    Calculate the 'candidate_score_out_of_10' taking into account similarity score, concept coverage, clarity, and completeness. Also generate the legacy 'scores' object (knowledge, communication, confidence, clarity, overall).

    STEP 6: GENERATE ADDITIONAL FEEDBACK
    Identify 'strengths' (concepts correctly explained) and 'areas_for_improvement' in detail.
    You must also evaluate communication skills and estimate speaking behavior (even if it's text-based, infer from sentence structure, filler words, clarity).

    CRITICAL INSTRUCTION: For 'strengths', 'areas_for_improvement', and 'improvement_tips', you MUST provide detailed, explanatory sentences (not just 2-3 words).
    List explicit examples outlining what mistake occurred, why it is problematic, and exactly what the user should specify or phrase better next time. Give actionable and detailed points so the user fully understands the rationale.

    Return as VALID JSON exactly matching this structure:
    {
      "question": "string",
      "candidate_answer": "string",
      "summary_feedback": "string",
      "strengths": ["string"],
      "areas_for_improvement": ["string"],
      "speaking_analysis": {
        "tone": "string",
        "confidence": "string",
        "pauses": "string",
        "fluency": "string",
        "speaking_speed": "string",
        "filler_words": "string"
      },
      "scores": {
        "knowledge": number,
        "communication": number,
        "confidence": number,
        "clarity": number,
        "overall": number
      },
      "improvement_tips": ["string"],
      "ideal_answer_comparison": {
        "ideal_answer": "string",
        "similarity_score_percentage": number,
        "candidate_score_out_of_10": number,
        "covered_concepts": ["string"],
        "missing_concepts": ["string"],
        "evaluation_feedback": {
          "strengths": ["string"],
          "areas_for_improvement": ["string"]
        }
      }
    }
    Do not include markdown backticks like \`\`\`json. Just the raw JSON.
  `;

    try {
        const response = await callWithRetry(prompt);
        const text = response.text();
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error evaluating interview answer:", error);
        return {
            question,
            candidate_answer: userAnswer,
            summary_feedback: "Could not evaluate answer at this time due to an error.",
            strengths: [],
            areas_for_improvement: [],
            speaking_analysis: {
                tone: "N/A", confidence: "N/A", pauses: "N/A", fluency: "N/A", speaking_speed: "N/A", filler_words: "N/A"
            },
            scores: { knowledge: 0, communication: 0, confidence: 0, clarity: 0, overall: 0 },
            improvement_tips: [],
            ideal_answer_comparison: {
                ideal_answer: "N/A",
                similarity_score_percentage: 0,
                candidate_score_out_of_10: 0,
                covered_concepts: [],
                missing_concepts: [],
                evaluation_feedback: {
                    strengths: [],
                    areas_for_improvement: []
                }
            }
        };
    }
}

export interface LearningRecommendation {
    weak_area: string;
    recommended_topics: { topic: string; learning_link: string }[];
    recommended_skills: { skill: string; learning_link: string }[];
    suggested_courses: { course_name: string; platform: string; course_link: string }[];
    suggested_certifications: { certification_name: string; certification_link: string }[];
}

export interface OverallFeedback {
    interview_round: string;
    overall_summary: string;
    strengths: string[];
    areas_for_improvement: string[];
    overall_scores: {
        knowledge: number;
        communication: number;
        confidence: number;
        clarity: number;
        overall_interview: number;
    };
    final_improvement_tips: string[];
    learning_recommendations?: LearningRecommendation[];
}

export async function generateOverallFeedback(
    jobTitle: string,
    roundType: string,
    questionsAndAnswers: Array<{ question: string, answer: string, score: number, aiFeedback: string }>
): Promise<OverallFeedback> {
    const qaContext = questionsAndAnswers.map((qa, i) => `Q${i+1}: ${qa.question}\nA${i+1}: ${qa.answer}\nScore: ${qa.score}/10\nFeedback: ${qa.aiFeedback}`).join('\n\n');

    const prompt = `
    You are an expert Interviewer evaluating a candidate's overall performance in a ${roundType} for the role of ${jobTitle}.
    
    Here is the transcript of their questions, answers, and individual scores:
    ${qaContext}
    
    Generate an overall summary of their performance including:
    - Overall performance
    - Strengths across answers
    - Key improvement areas
    - Communication assessment
    - Confidence level
    
    CRITICAL: You must detect the candidate's weak areas (e.g., low score, missing concepts). Map these weak areas to learning recommendations. 
    1. Topics and Skills: generate learning links using this dynamic YouTube search format: https://www.youtube.com/results?search_query={topic_or_skill}+tutorial.
    2. Courses and Certifications: provide real, predefined external links to Coursera, edX, Google Cloud, IBM, etc., for beginner-friendly courses related to the weak areas.
    
    Provide overall scores out of 10 based on the average of their individual answers.
    
    Return as VALID JSON exactly matching this structure:
    {
      "interview_round": "${roundType}",
      "overall_summary": "string",
      "strengths": ["string"],
      "areas_for_improvement": ["string"],
      "overall_scores": {
        "knowledge": number,
        "communication": number,
        "confidence": number,
        "clarity": number,
        "overall_interview": number
      },
      "final_improvement_tips": ["string"],
      "learning_recommendations": [
        {
          "weak_area": "string",
          "recommended_topics": [
            {
              "topic": "string",
              "learning_link": "https://www.youtube.com/results?search_query=..."
            }
          ],
          "recommended_skills": [
            {
              "skill": "string",
              "learning_link": "https://www.youtube.com/results?search_query=..."
            }
          ],
          "suggested_courses": [
            {
              "course_name": "string",
              "platform": "string",
              "course_link": "string"
            }
          ],
          "suggested_certifications": [
            {
              "certification_name": "string",
              "certification_link": "string"
            }
          ]
        }
      ]
    }
    Do not include markdown backticks like \`\`\`json. Just the raw JSON.
  `;

    try {
        const response = await callWithRetry(prompt);
        const text = response.text();
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error generating overall feedback:", error);
        return {
            interview_round: roundType,
            overall_summary: "Could not generate overall feedback due to an error.",
            strengths: [],
            areas_for_improvement: [],
            overall_scores: { knowledge: 0, communication: 0, confidence: 0, clarity: 0, overall_interview: 0 },
            final_improvement_tips: [],
            learning_recommendations: []
        };
    }
}
