import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/FileUpload";
import ATSDashboard from "@/components/ats/ATSDashboard";
import AnalysisProgressIndicator from "@/components/ats/AnalysisProgressIndicator";
import { AlertCircle } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import type { ATSAnalysisResult } from "../../../shared/atsTypes";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type AnalysisPhaseType = 'idle' | 'extracting' | 'keyword-analysis' | 'semantic-analysis' | 'generating-report' | 'complete' | 'error';

const getAnalysisPhases = (currentPhase: AnalysisPhaseType) => {
  const phases = [
    { id: 'extract', name: 'Text Extraction', status: 'pending' as const },
    { id: 'keyword', name: 'Keyword Analysis', status: 'pending' as const },
    { id: 'semantic', name: 'Semantic Analysis (SBERT)', status: 'pending' as const },
    { id: 'report', name: 'Generating Report', status: 'pending' as const },
  ];

  if (currentPhase === 'idle' || currentPhase === 'error') {
    return phases;
  }

  // Update statuses based on current phase
  const phaseOrder = ['extracting', 'keyword-analysis', 'semantic-analysis', 'generating-report'];
  const currentIndex = phaseOrder.indexOf(currentPhase);

  return phases.map((phase, index) => {
    if (index < currentIndex) {
      return { ...phase, status: 'complete' as const };
    } else if (index === currentIndex) {
      return { ...phase, status: 'processing' as const };
    }
    return phase;
  });
};

export default function ResumeScreening() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhaseType>('idle');
  const [result, setResult] = useState<(ATSAnalysisResult & { resumeText: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + " ";
    }
    return fullText;
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleAnalyze = async () => {
    if (!file || !jobDescription) {
      setError("Please upload a resume and provide a Job Description.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setAnalysisPhase('extracting');

    try {
      // Phase 1: Extract text from resume
      let resumeText = "";
      if (file.type === "application/pdf") {
        resumeText = await extractTextFromPdf(file);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        resumeText = await extractTextFromDocx(file);
      } else {
        throw new Error("Unsupported file type. Please upload PDF or DOCX.");
      }

      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error("Could not extract text from the resume. The file may be empty or corrupted.");
      }

      console.log("Extracted Resume Text Length:", resumeText.length);

      // Phase 2: Keyword Analysis
      setAnalysisPhase('keyword-analysis');
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for UI feedback

      // Phase 3: Semantic Analysis & Report Generation
      setAnalysisPhase('semantic-analysis');

      // Call the ATS analysis API
      const response = await fetch('/api/ats-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          jobRole: jobRole || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }

      setAnalysisPhase('generating-report');
      const analysisResult: ATSAnalysisResult = await response.json();

      // Phase 4: Complete
      setAnalysisPhase('complete');
      setResult({ ...analysisResult, resumeText }); // Inject resumeText locally for other tabs

      console.log("ATS Analysis Complete:", {
        finalScore: analysisResult.finalScore,
        keywordScore: analysisResult.keywordScore.score,
        semanticScore: analysisResult.semanticScore.score,
        processingTime: analysisResult.processingTime,
      });

    } catch (error: any) {
      console.error("Analysis failed:", error);
      setError(error.message || "An unexpected error occurred during analysis.");
      setAnalysisPhase('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (!result) return;

    // Create JSON export
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ats-analysis-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setJobDescription("");
    setJobRole("");
    setResult(null);
    setError(null);
    setAnalysisPhase('idle');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      
      <main className="flex-grow py-12 bg-background transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transition-colors">
              AI-Powered ATS Resume Screening
            </h1>
            <p className="text-muted-foreground">
              Analyze your resume against job descriptions with dual AI scoring: keyword matching + semantic similarity
            </p>
          </div>

          {!result ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                    Upload Your Resume
                  </h2>
                  <FileUpload onFileSelect={setFile} accept=".pdf,.docx" maxSize={10} />
                  {file && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      ✓ {file.name}
                    </p>
                  )}
                </Card>

                <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                    Job Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="jobRole">Job Role (Optional)</Label>
                      <Textarea
                        id="jobRole"
                        placeholder="e.g., Full Stack Developer"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        className="mt-1 resize-none"
                        rows={1}
                      />
                    </div>
                    <div>
                      <Label htmlFor="jobDescription">Job Description *</Label>
                      <Textarea
                        id="jobDescription"
                        placeholder="Paste the full job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="mt-1 min-h-[200px] font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {jobDescription.length} characters
                      </p>
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      className="w-full h-12 text-lg font-semibold"
                      disabled={isAnalyzing || !file || !jobDescription}
                      data-testid="button-analyze"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Preview/Status Section */}
              <div>
                {isAnalyzing ? (
                  <Card className="p-8">
                    <AnalysisProgressIndicator phases={getAnalysisPhases(analysisPhase)} />
                  </Card>
                ) : error ? (
                  <Card className="p-8 border-destructive/50 bg-destructive/10">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Analysis Failed</h3>
                        <p className="text-sm text-foreground/80 mb-4">{error}</p>
                        <Button onClick={handleReset} variant="outline" size="sm">
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-12 h-full flex items-center justify-center bg-card/50 border-dashed border-2">
                    <div className="text-center text-muted-foreground">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                        <span className="text-4xl">🎯</span>
                      </div>
                      <p className="text-lg font-medium mb-2">Ready to Optimize Your Resume?</p>
                      <p className="text-sm max-w-md">
                        Upload your resume and paste a job description to get comprehensive ATS analysis with dual AI scoring.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={handleReset} variant="outline">
                  ← Analyze Another Resume
                </Button>
              </div>

              {/* ATS Dashboard & Deep Analysis */}
              <div className="space-y-6">
                <Tabs defaultValue="ats" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="ats">ATS Score</TabsTrigger>
                    <TabsTrigger value="deep-analysis">Deep Analysis</TabsTrigger>
                    <TabsTrigger value="rewrite">Rewritten CV</TabsTrigger>
                  </TabsList>

                  <TabsContent value="ats">
                    <ATSDashboard result={result} onExport={handleExport} />
                  </TabsContent>

                  <TabsContent value="deep-analysis">
                    <DeepAnalysisPanel resumeText={result.resumeText || ""} />
                  </TabsContent>

                  <TabsContent value="rewrite">
                    <RewrittenCVPanel resumeText={result.resumeText || ""} />
                  </TabsContent>
                </Tabs>

                <div className="flex gap-3 justify-end">
                  <Button onClick={handleReset} variant="outline">
                    Analyze Another Resume
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

          </div>
  );
}

// Inner Components for new features
function DeepAnalysisPanel({ resumeText }: { resumeText: string }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const performDeepAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumes/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: resumeText })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">Deep AI Analysis</h3>
        <p className="text-muted-foreground mb-6">Unlock detailed insights, grammar checks, and impact scoring using Gemini AI.</p>
        <Button onClick={performDeepAnalysis} size="lg">Run Deep Analysis</Button>
      </Card>
    );
  }

  if (loading) {
    return <Card className="p-12 text-center">Analyzing resume with advanced AI...</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <ScoreCard label="Overall" score={analysis.score} />
        <ScoreCard label="Grammar" score={analysis.grammarScore} />
        <ScoreCard label="Impact" score={analysis.impactScore} />
        <ScoreCard label="Structure" score={analysis.structureScore} />
      </div>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Detailed Feedback</h3>
        <div className="space-y-4">
          {analysis.feedback?.map((item: any, i: number) => (
            <div key={i} className={`p-4 rounded-lg border-l-4 ${item.priority === 'high' ? 'border-destructive bg-destructive/10' : 'border-blue-500 bg-blue-500/10'}`}>
              <div className="flex justify-between mb-1">
                <span className="font-semibold capitalize">{item.section}</span>
                <span className="text-xs uppercase tracking-wide font-bold opacity-70">{item.priority} Priority</span>
              </div>
              <p className="font-medium text-sm mb-1">{item.issue}</p>
              <p className="text-sm opacity-90">Suggestion: {item.suggestion}</p>
            </div>
          ))}
        </div>
      </Card>
      {analysis.improvedContent?.experience && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Suggested Experience Rewrites</h3>
          {analysis.improvedContent.experience.map((exp: any, i: number) => (
            <div key={i} className="mb-4 last:mb-0">
              <h4 className="font-medium">{exp.role} at {exp.company}</h4>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                {exp.refinedBullets.map((bullet: string, j: number) => (
                  <li key={j}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function RewrittenCVPanel({ resumeText }: { resumeText: string }) {
  const [rewritten, setRewritten] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateRewrite = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumes/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // We'll just ask to rewrite the whole "summary" or "experience" for now as a demo,
        // or effectively we might need a specific endpoint for full rewrite.
        // For this demo, let's rewrite the summary + experience as a single block if possible, 
        // or just use 'experience' type for the bulk.
        body: JSON.stringify({ text: resumeText, sectionType: "experience" })
      });
      const data = await res.json();
      setRewritten(data.rewrittenText);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!rewritten && !loading) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">Professional Rewrite</h3>
        <p className="text-muted-foreground mb-6">Let AI rewrite your experience section to be more impactful and ATS-friendly.<br />(This effectively rewrites your bullet points).</p>
        <Button onClick={generateRewrite} size="lg">Generate Rewritten Content</Button>
      </Card>
    );
  }

  if (loading) return <Card className="p-12 text-center">Rewriting your CV content...</Card>;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Improved Content</h3>
        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(rewritten || "")}>Copy Text</Button>
      </div>
      <div className="bg-background/50 p-4 rounded-md whitespace-pre-wrap text-sm border border-border/50 font-mono leading-relaxed text-foreground">
        {rewritten}
      </div>
    </Card>
  );
}

function ScoreCard({ label, score }: { label: string, score: number }) {
  return (
    <Card className="p-4 text-center">
      <div className="text-2xl font-bold mb-1">{score}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
    </Card>
  );
}
