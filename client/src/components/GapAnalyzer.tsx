import React, { useState } from "react";
import { useResume } from "../contexts/ResumeContext";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Loader2, Target, AlertTriangle, CheckCircle, RefreshCw, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GapAnalysisResponse } from "../../../server/lib/gapAnalysis";

interface GapAnalyzerProps {
  currentResumeData: any; // Using CVFormData from EditableTemplateEditor
  onApplySuggestion: (sectionName: string, suggestion: string) => void;
}

export default function GapAnalyzer({ currentResumeData, onApplySuggestion }: GapAnalyzerProps) {
  const { state, dispatch } = useResume();
  const [jobDescription, setJobDescription] = useState("");
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Requirement",
        description: "Please paste a job description to analyze.",
        variant: "destructive"
      });
      return;
    }

    dispatch({ type: "SET_GAP_ANALYSIS_LOADING", payload: true });

    try {
      const response = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resumeData: currentResumeData
        })
      });

      if (!response.ok) {
        throw new Error("Analysis failed to run.");
      }

      const report = await response.json();
      dispatch({ type: "SET_GAP_REPORT", payload: report });
    } catch (error) {
      console.error(error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the resume against the JD.",
        variant: "destructive"
      });
      dispatch({ type: "SET_GAP_ANALYSIS_LOADING", payload: false });
    }
  };

  const report: GapAnalysisResponse | null = state.gapReport;

  return (
    <Card className="flex flex-col h-full bg-slate-50 border-l border-slate-200 overflow-hidden shadow-xl">
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <Target className="w-5 h-5 text-indigo-600" />
          CV Gap Analyzer
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Tailor your CV to a specific job description.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {!report ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Paste Job Description</label>
              <Textarea
                placeholder="Paste the target role's job description or requirements here..."
                className="min-h-[250px] resize-y bg-white text-sm"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={state.isAnalyzingGap}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {state.isAnalyzingGap ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Match...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Analyze CV vs JD
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-700">Overall Match Match</h3>
                <span className={`text-2xl font-bold ${report.overall_match >= 75 ? "text-green-600" : report.overall_match >= 50 ? "text-amber-500" : "text-red-500"}`}>
                  {report.overall_match}%
                </span>
              </div>
              
              {report.penalty_applied && (
                <div className="mt-3 bg-red-50 text-red-700 border border-red-200 p-2.5 rounded text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Domain mismatch penalty applied. The core keywords do not align with your CV context.</p>
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Section Breakdown</h4>
                <div className="space-y-4">
                  {Object.entries(report.sections).map(([sectionName, data]: [string, any]) => (
                    <div key={sectionName} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700">{sectionName}</span>
                        <div className="flex items-center gap-1.5">
                          {data.status === "strong" && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                          {data.status === "weak" && <Activity className="w-3.5 h-3.5 text-amber-500" />}
                          {data.status === "missing" && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                          <span className={`text-xs font-bold ${data.status === "strong" ? "text-green-600" : data.status === "weak" ? "text-amber-600" : "text-red-600"}`}>
                            {data.score}/100
                          </span>
                        </div>
                      </div>
                      
                      {data.missing_keywords.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {data.missing_keywords.map((kw: string) => (
                            <span key={kw} className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] rounded border border-red-100 font-medium">
                              Missing: {kw}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {(data.status === "weak" || data.status === "missing") && (
                        <div className="mt-2 text-xs bg-amber-50/50 p-2 rounded border border-amber-100">
                          <p className="text-slate-600 italic">" {data.suggestion} "</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 mt-1.5 text-[10px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2"
                            onClick={() => onApplySuggestion(sectionName, data.suggestion)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" /> Help me fix this
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => dispatch({ type: "CLEAR_GAP_REPORT" })}
              className="w-full text-xs"
            >
              Analyze Another Job
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
