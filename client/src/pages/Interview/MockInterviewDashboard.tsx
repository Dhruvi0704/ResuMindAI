import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Briefcase, UserCheck, FileText, Target, Calendar, BarChart, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function MockInterviewDashboard() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        jobTitle: "",
        experienceLevel: "",
        roundType: "",
        jobDescription: ""
    });

    const { data: history, isLoading: historyLoading } = useQuery<any[]>({
        queryKey: ["/api/interviews/history/anonymous"],
    });

    const getPerformanceIndicator = (scoreStr?: string | null) => {
        if (!scoreStr) return null;
        const score = parseFloat(scoreStr);
        if (isNaN(score)) return null;
        if (score >= 8) return <Badge className="bg-green-500 hover:bg-green-600">Good</Badge>;
        if (score >= 5) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Average</Badge>;
        return <Badge variant="destructive">Needs Improvement</Badge>;
    };

    const handleStartInterview = async () => {
        if (!formData.jobTitle || !formData.experienceLevel || !formData.roundType) {
            toast({
                title: "Missing Information",
                description: "Please provide a Job Title, Experience Level, and Interview Round Type.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            const res = await apiRequest("POST", "/api/interviews/start", {
                ...formData
            });
            const data = await res.json();

            toast({
                title: "Interview Ready",
                description: "Your custom interview session has been generated.",
            });

            setLocation(`/mock-interview/${data.interviewId}`);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to generate interview. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
                        <div className="flex-1 p-6 md:p-12">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
                            <Briefcase className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">
                            AI Mock Interviewer
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Practice for your dream job with our AI-powered interview simulator.
                            Get real-time feedback and improve your answers.
                        </p>
                    </motion.div>

                    <Tabs defaultValue="new" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="new">Start New Interview</TabsTrigger>
                            <TabsTrigger value="history">Previous Interviews</TabsTrigger>
                        </TabsList>

                        <TabsContent value="new" className="space-y-8">
                            {/* Configuration Card */}
                            <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-2 border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Configure Your Session</CardTitle>
                                <CardDescription>
                                    Tell us about the role you are applying for so we can tailor the questions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="jobTitle">Job Title</Label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="jobTitle"
                                                placeholder="e.g. Senior React Developer"
                                                className="pl-9 bg-background/50 border-input"
                                                value={formData.jobTitle}
                                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="experience">Experience Level</Label>
                                        <Select
                                            value={formData.experienceLevel}
                                            onValueChange={(val) => setFormData({ ...formData, experienceLevel: val })}
                                        >
                                            <SelectTrigger id="experience" className="pl-9 relative bg-background/50 border-input">
                                                <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <SelectValue placeholder="Select Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Fresher">Fresher (0-1 years)</SelectItem>
                                                <SelectItem value="Junior">Junior (1-3 years)</SelectItem>
                                                <SelectItem value="Mid-Level">Mid-Level (3-5 years)</SelectItem>
                                                <SelectItem value="Senior">Senior (5-8 years)</SelectItem>
                                                <SelectItem value="Lead">Lead / Principal (8+ years)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="roundType">Interview Round Type</Label>
                                        <Select
                                            value={formData.roundType}
                                            onValueChange={(val) => setFormData({ ...formData, roundType: val })}
                                        >
                                            <SelectTrigger id="roundType" className="pl-9 relative bg-background/50 border-input">
                                                <Target className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <SelectValue placeholder="Select Round Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Technical Round">Technical Round</SelectItem>
                                                <SelectItem value="Semi-Technical Round">Semi-Technical Round</SelectItem>
                                                <SelectItem value="HR Round">HR Round</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                        <div className="space-y-2">
                                    <Label htmlFor="jd">Job Description (Optional)</Label>
                                    <div className="relative mt-2">
                                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Textarea
                                            id="jd"
                                            placeholder="Paste the job description here for better targeting..."
                                            className="pl-9 min-h-[120px] bg-background/50 border-input"
                                            value={formData.jobDescription}
                                            onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Adding a JD helps the AI generate very specific scenario-based questions.
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        size="lg"
                                        className="w-full text-lg font-semibold"
                                        onClick={handleStartInterview}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Generating Interview Questions...
                                            </>
                                        ) : (
                                            "Start Mock Interview"
                                        )}
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center pt-8">
                        <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                            <div className="text-3xl mb-2">🎯</div>
                            <h3 className="font-semibold mb-1">Role Specific</h3>
                            <p className="text-sm text-muted-foreground">Questions tailored exactly to your target job title and level.</p>
                        </div>
                        <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                            <div className="text-3xl mb-2">🤖</div>
                            <h3 className="font-semibold mb-1">AI Feedback</h3>
                            <p className="text-sm text-muted-foreground">Instant analysis of your answers with improvement tips.</p>
                        </div>
                        <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                            <div className="text-3xl mb-2">📈</div>
                            <h3 className="font-semibold mb-1">Score Tracking</h3>
                            <p className="text-sm text-muted-foreground">Get an overall score and detailed performance breakdown.</p>
                        </div>
                    </div>
                        </TabsContent>

                        <TabsContent value="history">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Card className="border-2 border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-primary" />
                                            Interview History
                                        </CardTitle>
                                        <CardDescription>
                                            Review your past interviews and track your progress over time.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {historyLoading ? (
                                            <div className="flex justify-center p-8">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                            </div>
                                        ) : !history || history.length === 0 ? (
                                            <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                                <p>No previous interviews found.</p>
                                                <p className="text-sm mt-2">Complete a mock interview to see your history here.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {history.map((interview: any) => (
                                                    <div 
                                                        key={interview.id} 
                                                        className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors"
                                                    >
                                                        <div className="space-y-2 mb-4 md:mb-0">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="font-semibold text-lg">{interview.jobTitle}</h3>
                                                                <Badge variant="outline">{interview.roundType}</Badge>
                                                                <Badge variant="secondary">{interview.experienceLevel}</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {new Date(interview.createdAt).toLocaleDateString(undefined, {
                                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                                    })}
                                                                </span>
                                                                {interview.score !== null && interview.score !== undefined && (
                                                                    <span className="flex items-center gap-1">
                                                                        <BarChart className="w-4 h-4" />
                                                                        Score: {interview.score}/10
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                            {getPerformanceIndicator(interview.score)}
                                                            <Button 
                                                                variant="default" 
                                                                className="flex items-center gap-2"
                                                                onClick={() => setLocation(`/mock-interview/${interview.id}/result`)}
                                                            >
                                                                View Details
                                                                <ChevronRight className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
                    </div>
    );
}
