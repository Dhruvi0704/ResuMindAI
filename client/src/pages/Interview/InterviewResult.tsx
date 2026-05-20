import React, { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trophy, RotateCcw, Home, Target, Zap, AlertCircle, CheckCircle2, XCircle, Mic, Star, Lightbulb, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function InterviewResult() {
    const [, params] = useRoute("/mock-interview/:id/result");
    const [, setLocation] = useLocation();
    const [interview, setInterview] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params?.id) {
            apiRequest("GET", `/api/interviews/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    setInterview(data.interview);
                    setQuestions(data.questions);
                    setAnswers(data.answers);
                    setLoading(false);
                })
                .catch(err => console.error(err));
        }
    }, [params?.id]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    const score = parseFloat(interview.score || "0");
    const scoreColor = score >= 8 ? "text-green-600" : score >= 5 ? "text-yellow-600" : "text-red-600";
    const scorePercentage = (score / 10) * 100;

    let overallFeedbackData: any = null;
    try {
        if (interview.feedback && interview.feedback.startsWith("{")) {
            overallFeedbackData = JSON.parse(interview.feedback);
        }
    } catch (e) {
        console.error("Failed to parse overall feedback JSON", e);
    }

    const getMockedMissingData = (modelAnswer?: string) => ({
        scores: { overall: 0 },
        summary_feedback: "The candidate did not provide any answer to the question. This significantly impacts the evaluation as there is no content to assess regarding their technical knowledge, communication, or problem-solving approach. In an interview setting, failing to answer a fundamental question like this is a major concern.",
        ideal_answer_comparison: {
            similarity_score_percentage: 0,
            candidate_score_out_of_10: 0,
            ideal_answer: modelAnswer || "A complete and comprehensive answer was expected.",
            covered_concepts: [],
            missing_concepts: ["Core concepts", "Technical explanation", "Problem-solving approach"],
            evaluation_feedback: {
                strengths: ["None identified due to missing answer."],
                areas_for_improvement: ["Must provide an answer to evaluate knowledge."]
            }
        },
        strengths: ["None identified."],
        areas_for_improvement: ["The candidate must provide a comprehensive answer to demonstrate their skills and knowledge for this requirement."],
        speaking_analysis: {
            tone: "N/A", confidence: "0/10", pauses: "N/A", fluency: "N/A", speaking_speed: "N/A", filler_words: "N/A"
        },
        improvement_tips: [
            "Ensure you manage your time effectively to answer all questions.",
            "If you don't know the answer, explain your thought process or what you would do to find the answer."
        ]
    });

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">

                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", duration: 0.8 }}
                        className="inline-flex items-center justify-center p-6 bg-primary/10 rounded-full shadow-lg border-4 border-primary/20 mb-2"
                    >
                        <Trophy className="w-12 h-12 text-primary" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-foreground">Interview Complete!</h1>
                    <p className="text-muted-foreground">Here is how you performed in your {interview.jobTitle} ({interview.roundType}) interview.</p>
                </div>

                <Tabs defaultValue="overall" className="space-y-8 w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-[600px] mx-auto border-border bg-background/50">
                        <TabsTrigger value="overall">Overall Performance</TabsTrigger>
                        <TabsTrigger value="analysis">Question Analysis</TabsTrigger>
                        <TabsTrigger value="learning">Learning Recommendations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overall" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className={`md:col-span-2 h-fit border-l-8 bg-card/50 backdrop-blur-sm ${parseInt(interview.integrityScore || "100") < 60 ? "border-l-destructive" : "border-l-primary"}`}>
                        <CardHeader>
                            <CardTitle>Overall Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    {parseInt(interview.integrityScore || "100") < 60 ? (
                                        <div className="text-destructive font-bold text-lg flex items-center gap-2 mb-2">
                                            <AlertCircle className="w-5 h-5" /> Session Compromised
                                        </div>
                                    ) : (
                                        <div className={`text-5xl font-bold mb-2 ${scoreColor}`}>{score}/10</div>
                                    )}
                                </div>
                                <div className="w-1/3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Overall Score</span>
                                        <span>{Math.round(scorePercentage)}%</span>
                                    </div>
                                    <Progress value={scorePercentage} className="h-3" />
                                </div>
                            </div>
                            
                            {overallFeedbackData ? (
                                <div className="space-y-4 pt-4 border-t border-border/50">
                                    <p className="text-foreground bg-primary/5 p-4 rounded-md border border-primary/10 italic">
                                        "{overallFeedbackData.overall_summary}"
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-green-500 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" /> Key Strengths
                                            </h4>
                                            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                {overallFeedbackData.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-amber-500 flex items-center gap-2">
                                                <Target className="w-4 h-4" /> Areas for Improvement
                                            </h4>
                                            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                {overallFeedbackData.areas_for_improvement?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                    </div>

                                    {overallFeedbackData.overall_scores && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-border/50 mt-4">
                                            <div className="text-center p-2 bg-blue-500/10 border border-blue-500/20 rounded"><div className="text-xs text-blue-400 uppercase font-bold">Knowledge</div><div className="text-lg font-bold text-foreground">{overallFeedbackData.overall_scores.knowledge}/10</div></div>
                                            <div className="text-center p-2 bg-indigo-500/10 border border-indigo-500/20 rounded"><div className="text-xs text-indigo-400 uppercase font-bold">Communication</div><div className="text-lg font-bold text-foreground">{overallFeedbackData.overall_scores.communication}/10</div></div>
                                            <div className="text-center p-2 bg-purple-500/10 border border-purple-500/20 rounded"><div className="text-xs text-purple-400 uppercase font-bold">Confidence</div><div className="text-lg font-bold text-foreground">{overallFeedbackData.overall_scores.confidence}/10</div></div>
                                            <div className="text-center p-2 bg-pink-500/10 border border-pink-500/20 rounded"><div className="text-xs text-pink-400 uppercase font-bold">Clarity</div><div className="text-lg font-bold text-foreground">{overallFeedbackData.overall_scores.clarity}/10</div></div>
                                        </div>
                                    )}

                                    {!!overallFeedbackData.final_improvement_tips?.length && (
                                        <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                            <h4 className="font-semibold text-yellow-500 flex items-center gap-2 mb-2">
                                                <Lightbulb className="w-4 h-4" /> Final Tips
                                            </h4>
                                            <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                                {overallFeedbackData.final_improvement_tips.map((tip: string, i: number) => <li key={i}>{tip}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground pt-4 border-t border-border/50">
                                    {interview.terminationReason ? `Terminated: ${interview.terminationReason}` : interview.feedback}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className={`h-fit md:col-span-1 border-l-8 bg-card/50 backdrop-blur-sm ${parseInt(interview.integrityScore || "100") < 100 ? "border-l-destructive" : "border-l-blue-500"}`}>
                        <CardHeader>
                            <CardTitle>Session Integrity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-4xl font-bold mb-2 ${parseInt(interview.integrityScore || "100") < 100 ? "text-destructive" : "text-blue-500"}`}>
                                {interview.integrityScore || 100}%
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                                {interview.terminationReason || (parseInt(interview.violationCount || "0") > 0
                                    ? `${interview.violationCount} suspicious activity detected.`
                                    : "No suspicious activity detected.")
                                }
                            </p>
                            <Progress value={parseInt(interview.integrityScore || "100")} className={`h-2 ${parseInt(interview.integrityScore || "100") < 100 ? "[&>div]:bg-destructive" : ""}`} />
                        </CardContent>
                    </Card>
                        </div>

                        {/* Combined Question Analysis */}
                        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                    Combined Question Analysis
                                </CardTitle>
                                <CardDescription>A complete summary of your answers and evaluations combined below the overall performance.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {questions.map((q, idx) => {
                                    const answer = answers.find(a => a.questionId === q.id);
                                    let qData: any = null;
                                    let qScore = parseFloat(answer?.score || "0");
                                    try {
                                        if (answer?.aiFeedback && answer.aiFeedback.startsWith("{")) {
                                            qData = JSON.parse(answer.aiFeedback);
                                            qScore = qData.scores?.overall || qScore;
                                        }
                                    } catch (e) {}

                                    // Force priority to the new ideal comparison scoring mechanism
                                    if (qData?.ideal_answer_comparison?.candidate_score_out_of_10 !== undefined) {
                                        qScore = parseFloat(qData.ideal_answer_comparison.candidate_score_out_of_10);
                                    }

                                    if (!answer || (answer.userAnswer?.trim() === "" && !answer.aiFeedback)) {
                                        qData = getMockedMissingData(q.modelAnswer);
                                        qScore = 0;
                                    }

                                    const scoreColor = qScore >= 7 ? "text-green-500" : qScore >= 4 ? "text-yellow-500" : "text-red-500";
                                    const bgColor = qScore >= 7 ? "bg-green-500/10" : qScore >= 4 ? "bg-yellow-500/10" : "bg-red-500/10";
                                    const borderColor = qScore >= 7 ? "border-green-500/20" : qScore >= 4 ? "border-yellow-500/20" : "border-red-500/20";

                                    return (
                                        <div key={q.id} className="p-4 rounded-lg border border-border/50 bg-background/50 space-y-3 relative overflow-hidden">
                                            <div className={`absolute top-0 right-0 px-3 py-1 font-bold rounded-bl-lg ${bgColor} ${scoreColor} ${borderColor} border-l border-b`}>
                                                {qScore}/10
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-foreground text-sm pr-12">
                                                    <span className="text-muted-foreground mr-2">Q{idx + 1}.</span> {q.question}
                                                </h4>
                                            </div>
                                            <div className="pl-4 border-l-2 border-primary/30 space-y-3 mt-3">
                                                <div className="space-y-1">
                                                    <span className="text-xs uppercase font-semibold text-blue-500 tracking-wider">Your Answer:</span>
                                                    <p className="text-sm text-foreground/80 line-clamp-2 italic">"{answer?.userAnswer || "(No Answer Provided)"}"</p>
                                                </div>
                                                {qData?.summary_feedback && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs uppercase font-semibold text-primary tracking-wider">AI Feedback:</span>
                                                        <p className="text-sm text-foreground/90 leading-relaxed">{qData.summary_feedback}</p>
                                                    </div>
                                                )}
                                                {qData?.ideal_answer_comparison && (
                                                    <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50 mt-2">
                                                        {qData.ideal_answer_comparison.similarity_score_percentage !== undefined && (
                                                             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Similarity: {qData.ideal_answer_comparison.similarity_score_percentage}%</Badge>
                                                        )}
                                                        {qData.ideal_answer_comparison.covered_concepts?.length > 0 && (
                                                             <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">{qData.ideal_answer_comparison.covered_concepts.length} Covered Concepts</Badge>
                                                        )}
                                                        {qData.ideal_answer_comparison.missing_concepts?.length > 0 && (
                                                             <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">{qData.ideal_answer_comparison.missing_concepts.length} Missing Concepts</Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analysis" className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground mb-4">
                            <Zap className="h-5 w-5 text-yellow-500" /> Deep Dive Question Analysis
                        </h2>

                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {questions.map((q, idx) => {
                                const answer = answers.find(a => a.questionId === q.id);
                                let qData: any = null;
                                let qScore = parseFloat(answer?.score || "0");
                                
                                try {
                                    if (answer?.aiFeedback && answer.aiFeedback.startsWith("{")) {
                                        qData = JSON.parse(answer.aiFeedback);
                                        qScore = qData.scores?.overall || qScore;
                                    }
                                } catch (e) {
                                    console.error("Failed to parse answer feedback JSON", e);
                                }

                                if (qData?.ideal_answer_comparison?.candidate_score_out_of_10 !== undefined) {
                                    qScore = parseFloat(qData.ideal_answer_comparison.candidate_score_out_of_10);
                                }

                                if (!answer || (answer.userAnswer?.trim() === "" && !answer.aiFeedback)) {
                                    qData = getMockedMissingData(q.modelAnswer);
                                    qScore = 0;
                                }

                                const statusColor = qScore >= 7 ? "bg-green-500/10 text-green-500 border-green-500/20" : qScore >= 4 ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-red-500/10 text-red-500 border-red-500/20";

                                return (
                                    <AccordionItem key={q.id} value={q.id} className="border-border/50 rounded-lg bg-card/50 backdrop-blur-sm shadow-sm px-4">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex flex-1 items-center justify-between mr-4 text-left">
                                                <div className="flex flex-col gap-1 pr-4">
                                                    <span className="font-semibold text-base text-foreground">Question {idx + 1}</span>
                                                    <span className="text-sm text-muted-foreground line-clamp-1">{q.question}</span>
                                                </div>
                                                <Badge variant="outline" className={`whitespace-nowrap px-3 py-1 ${statusColor}`}>
                                                    {qScore}/10
                                                </Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-6 pt-2 pb-4">
                                            
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2 bg-background/50 p-4 rounded-lg border border-border/50">
                                                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Question</h4>
                                                    <p className="text-sm text-foreground">{q.question}</p>
                                                </div>
                                                <div className="space-y-2 bg-green-500/5 p-4 rounded-lg border border-green-500/20">
                                                    <h4 className="font-semibold text-xs text-green-500 uppercase tracking-wider">Model Answer Summary</h4>
                                                    <p className="text-sm text-foreground/80">{q.modelAnswer || "N/A"}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 bg-background/50 p-4 rounded-lg border border-border/50 shadow-sm">
                                                <h4 className="font-semibold text-xs text-blue-500 uppercase tracking-wider">Your Answer</h4>
                                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{answer?.userAnswer || "(No Answer Provided)"}</p>
                                            </div>

                                            {qData?.ideal_answer_comparison && (
                                                <div className="space-y-4 bg-primary/5 p-5 rounded-lg border border-primary/20 shadow-sm relative overflow-hidden mt-4">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                                        <Zap className="w-24 h-24" />
                                                    </div>
                                                    <div className="flex items-center gap-2 border-b border-primary/10 pb-3 mb-3">
                                                        <Sparkles className="w-5 h-5 text-primary" />
                                                        <h3 className="font-bold text-lg text-primary">Ideal Answer Comparison</h3>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                        <div className="bg-background/80 p-3 rounded-lg border border-border/50 text-center">
                                                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Similarity</div>
                                                            <div className="text-2xl font-bold text-foreground">{qData.ideal_answer_comparison.similarity_score_percentage}%</div>
                                                        </div>
                                                        <div className="bg-background/80 p-3 rounded-lg border border-border/50 text-center">
                                                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Score</div>
                                                            <div className="text-2xl font-bold text-foreground">{qData.ideal_answer_comparison.candidate_score_out_of_10}/10</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mb-4 relative z-10">
                                                        <h4 className="font-semibold text-sm text-foreground">Generated Ideal Answer:</h4>
                                                        <p className="text-sm text-foreground/80 italic border-l-4 border-primary/30 pl-3">
                                                            "{qData.ideal_answer_comparison.ideal_answer?.replace(/\*/g, '')}"
                                                        </p>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4 mt-4 relative z-10">
                                                        <div className="space-y-2">
                                                            <h4 className="text-xs uppercase tracking-wider text-green-500 font-semibold mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Covered Concepts</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {qData.ideal_answer_comparison.covered_concepts?.length ? (
                                                                    qData.ideal_answer_comparison.covered_concepts.map((c: string, i: number) => (
                                                                        <Badge key={i} variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 whitespace-normal text-left h-auto py-1.5 px-3 leading-relaxed">{c}</Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">None identified.</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h4 className="text-xs uppercase tracking-wider text-red-500 font-semibold mb-2 flex items-center gap-1"><XCircle className="w-3 h-3"/> Missing Concepts</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {qData.ideal_answer_comparison.missing_concepts?.length ? (
                                                                    qData.ideal_answer_comparison.missing_concepts.map((c: string, i: number) => (
                                                                        <Badge key={i} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 whitespace-normal text-left h-auto py-1.5 px-3 leading-relaxed">{c}</Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">None identified.</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {qData.ideal_answer_comparison.evaluation_feedback && (
                                                        <div className="mt-4 pt-4 border-t border-primary/10 grid md:grid-cols-2 gap-4 relative z-10">
                                                            <div>
                                                                <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-1">Concept Strengths</h4>
                                                                <ul className="text-sm text-foreground/80 list-disc pl-4 space-y-1">
                                                                    {qData.ideal_answer_comparison.evaluation_feedback.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                                </ul>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-1">Concept Weaknesses</h4>
                                                                <ul className="text-sm text-foreground/80 list-disc pl-4 space-y-1">
                                                                    {qData.ideal_answer_comparison.evaluation_feedback.areas_for_improvement?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {qData ? (
                                                <div className="space-y-6">
                                                    <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/20">
                                                        <h4 className="font-semibold flex items-center gap-2 text-blue-400 mb-2"><Star className="w-4 h-4"/> AI Summary</h4>
                                                        <p className="text-sm text-foreground/80 leading-relaxed">{qData.summary_feedback}</p>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="bg-card/50 p-4 rounded-lg border border-border/50 shadow-sm">
                                                            <h4 className="font-semibold text-green-500 flex items-center gap-2 mb-3">
                                                                <CheckCircle2 className="w-4 h-4" /> Strengths
                                                            </h4>
                                                            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                                {qData.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                            </ul>
                                                        </div>
                                                        <div className="bg-card/50 p-4 rounded-lg border border-border/50 shadow-sm">
                                                            <h4 className="font-semibold text-amber-500 flex items-center gap-2 mb-3">
                                                                <Target className="w-4 h-4" /> Areas for Improvement
                                                            </h4>
                                                            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                                {qData.areas_for_improvement?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    {qData.speaking_analysis && (
                                                        <div className="bg-background/50 p-4 rounded-lg border border-border/50">
                                                            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                                                                <Mic className="w-4 h-4" /> Speaking Behavior Analysis
                                                            </h4>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-sm">
                                                                <div><span className="text-muted-foreground block text-xs uppercase">Tone</span><span className="font-medium text-foreground">{qData.speaking_analysis.tone}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs uppercase">Confidence</span><span className="font-medium text-foreground">{qData.speaking_analysis.confidence}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs uppercase">Pauses</span><span className="font-medium text-foreground">{qData.speaking_analysis.pauses}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs uppercase">Fluency</span><span className="font-medium text-foreground">{qData.speaking_analysis.fluency}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs uppercase">Pace</span><span className="font-medium text-foreground">{qData.speaking_analysis.speaking_speed}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs uppercase">Filler Words</span><span className="font-medium text-foreground">{qData.speaking_analysis.filler_words}</span></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {qData.improvement_tips && qData.improvement_tips.length > 0 && (
                                                        <div className="bg-yellow-500/5 p-4 rounded-lg border border-yellow-500/20">
                                                            <h4 className="font-semibold text-yellow-500 flex items-center gap-2 mb-2">
                                                                <Lightbulb className="w-4 h-4" /> Actionable Tips
                                                            </h4>
                                                            <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-1">
                                                                {qData.improvement_tips.map((tip: string, i: number) => <li key={i}>{tip}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}

                                                </div>
                                            ) : (
                                                <div className="bg-blue-500/5 p-4 rounded border border-blue-500/20 mt-4">
                                                    <h4 className="font-semibold text-sm text-blue-400 mb-2 flex items-center gap-2">
                                                        <Target className="h-4 w-4" /> Legacy AI Feedback
                                                    </h4>
                                                    <p className="text-sm text-foreground/80 mb-2">{answer?.aiFeedback || "No feedback generated."}</p>
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                            {questions.length === 0 && (
                                <p className="text-muted-foreground italic text-center py-8">No questions were recorded for this session.</p>
                            )}
                        </Accordion>
                    </TabsContent>

                    <TabsContent value="learning" className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground mb-4">
                            <Lightbulb className="h-5 w-5 text-yellow-500" /> Personalized Learning Recommendations
                        </h2>
                        
                        {!overallFeedbackData?.learning_recommendations || overallFeedbackData.learning_recommendations.length === 0 ? (
                            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                                <CardContent className="pt-6 text-center text-muted-foreground">
                                    No specific learning recommendations found for this session. This may be because the session was completed before this feature was introduced or no major weak areas were detected.
                                </CardContent>
                            </Card>
                        ) : (
                            overallFeedbackData.learning_recommendations.map((rec: any, idx: number) => (
                                <Card key={idx} className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden mb-6">
                                    <div className="bg-primary/10 px-4 py-3 border-b border-border/50">
                                        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                                            <Target className="w-5 h-5" /> Weak Area: {rec.weak_area}
                                        </h3>
                                    </div>
                                    <CardContent className="p-6 space-y-6">
                                        {/* Recommended Topics */}
                                        {rec.recommended_topics && rec.recommended_topics.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                                                    <Zap className="w-4 h-4 text-yellow-500" /> Recommended Topics
                                                </h4>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {rec.recommended_topics.map((t: any, i: number) => (
                                                        <li key={i} className="flex flex-col p-3 rounded-lg border border-border/50 bg-background/50">
                                                            <span className="font-medium text-sm mb-2">{t.topic}</span>
                                                            <a href={t.learning_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-600 font-medium inline-flex items-center">
                                                                Learn &rarr;
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {/* Recommended Skills */}
                                        {rec.recommended_skills && rec.recommended_skills.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                                                    <Star className="w-4 h-4 text-blue-500" /> Skills to Learn
                                                </h4>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {rec.recommended_skills.map((s: any, i: number) => (
                                                        <li key={i} className="flex flex-col p-3 rounded-lg border border-border/50 bg-background/50">
                                                            <span className="font-medium text-sm mb-2">{s.skill}</span>
                                                            <a href={s.learning_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-600 font-medium inline-flex items-center">
                                                                Learn &rarr;
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Suggested Courses */}
                                        {rec.suggested_courses && rec.suggested_courses.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                                                    <Lightbulb className="w-4 h-4 text-green-500" /> Suggested Courses
                                                </h4>
                                                <ul className="space-y-2">
                                                    {rec.suggested_courses.map((c: any, i: number) => (
                                                        <li key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                                                            <div>
                                                                <span className="font-medium text-sm block text-foreground">{c.course_name}</span>
                                                                <span className="text-xs text-muted-foreground">{c.platform}</span>
                                                            </div>
                                                            <a href={c.course_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-600 font-medium whitespace-nowrap ml-4">
                                                                View Course &rarr;
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Suggested Certifications */}
                                        {rec.suggested_certifications && rec.suggested_certifications.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                                                    <Trophy className="w-4 h-4 text-purple-500" /> Suggested Certifications
                                                </h4>
                                                <ul className="space-y-2">
                                                    {rec.suggested_certifications.map((c: any, i: number) => (
                                                        <li key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                                                            <span className="font-medium text-sm text-foreground">{c.certification_name}</span>
                                                            <a href={c.certification_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-600 font-medium whitespace-nowrap ml-4">
                                                                View details &rarr;
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>

                <div className="flex justify-center pt-8 border-t border-border/50">
                    <Button variant="outline" onClick={() => setLocation("/mock-interview")}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Start New Interview
                    </Button>
                    <Button onClick={() => setLocation("/")}>
                        <Home className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </div>

            </div>
        </div>
    );
}
