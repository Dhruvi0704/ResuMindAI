import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Briefcase, GraduationCap, Award, Settings, Wand2 } from "lucide-react";

export interface RecruiterEvaluationResult {
  candidateScore: number;
  confidenceScore: number;
  skillsMatchScore: number;
  experienceRelevanceScore: number;
  projectRelevanceScore: number;
  educationAlignmentScore: number;
  resumeQualityScore: number;
  atsKeywordMatchPercentage: number;
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: string;
  interviewChance: number;
  offerProbability: number;
  skillGaps: string[];
  sectionReasons?: Record<string, string>;
  evaluatedJobTitle?: string;
}

interface AIRecruiterReportProps {
  report: RecruiterEvaluationResult;
  onImproveClick: () => void;
  isImproving: boolean;
}

export default function AIRecruiterReport({ report, onImproveClick, isImproving }: AIRecruiterReportProps) {
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Score Card */}
        <Card className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <CardContent className="p-8 flex flex-col items-center justify-center h-full relative z-10">
            <h3 className="text-slate-300 font-medium tracking-wider uppercase text-sm mb-6">Candidate Score</h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={`${report.candidateScore * 2.827} 282.7`}
                  className={`${getScoreColor(report.candidateScore)} transition-all duration-1000 ease-out`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-5xl font-bold ${getScoreColor(report.candidateScore)}`}>{Math.round(report.candidateScore)}</span>
                <span className="text-slate-400 text-sm">/ 100</span>
              </div>
            </div>

            <div className="text-center w-full">
              <div className="mb-4">
                <p className="text-xl font-semibold mb-1">{report.hiringRecommendation}</p>
                {report.confidenceScore && (
                  <p className="text-xs text-slate-400 bg-black/20 inline-block px-3 py-1 rounded-full border border-white/10">
                    AI Confidence Score: <span className="font-bold text-white">{report.confidenceScore}%</span>
                  </p>
                )}
              </div>
              
              <div className="flex justify-between w-full mt-2 bg-white/10 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Interview Chance</p>
                  <p className="text-2xl font-bold">{report.interviewChance}%</p>
                </div>
                <div className="w-px bg-white/20"></div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Offer Probability</p>
                  <p className="text-2xl font-bold">{report.offerProbability}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Metrics */}
        <div className="flex-1 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                ATS Keyword Match
                <span className={`ml-auto font-bold ${getScoreColor(report.atsKeywordMatchPercentage)}`}>
                  {report.atsKeywordMatchPercentage}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={report.atsKeywordMatchPercentage} className={`h-2 ${getProgressColor(report.atsKeywordMatchPercentage)}`} />
              <p className="text-xs text-muted-foreground mt-2">Keywords found in Job Description vs Resume</p>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Evaluation Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><Award className="w-4 h-4 text-emerald-500" /> Skills Match</span>
                  <span className="font-semibold">{report.skillsMatchScore}/100</span>
                </div>
                <Progress value={report.skillsMatchScore} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-orange-500" /> Experience Relevance</span>
                  <span className="font-semibold">{report.experienceRelevanceScore}/100</span>
                </div>
                <Progress value={report.experienceRelevanceScore} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-500" /> Project Relevance</span>
                  <span className="font-semibold">{report.projectRelevanceScore}/100</span>
                </div>
                <Progress value={report.projectRelevanceScore} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-blue-500" /> Education & Quality</span>
                  <span className="font-semibold">{Math.round((report.educationAlignmentScore + report.resumeQualityScore)/2)}/100</span>
                </div>
                <Progress value={Math.round((report.educationAlignmentScore + report.resumeQualityScore)/2)} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action / Improvement Box */}
      <Card className="bg-indigo-50 border-indigo-100 overflow-hidden relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <h3 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Maximize Your Chances
            </h3>
            <p className="text-indigo-700 max-w-xl">
              Our AI can automatically rewrite your resume to better match these job requirements, improving your ATS score and highlighting the most relevant experience.
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={onImproveClick} 
            disabled={isImproving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px] shadow-lg shadow-indigo-600/20"
          >
            {isImproving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Optimizing Resume...
              </span>
            ) : "Improve Resume for This Job"}
          </Button>
        </CardContent>
      </Card>

      {/* Feedback Sections */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="bg-emerald-50/50 dark:bg-emerald-900/10 pb-4">
            <CardTitle className="text-emerald-700 dark:text-emerald-400 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              {report.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
              {report.strengths.length === 0 && <p className="text-sm text-muted-foreground">No prominent strengths identified for this specific role.</p>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-rose-50/50 dark:bg-rose-900/10 pb-4">
            <CardTitle className="text-rose-700 dark:text-rose-400 text-base flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              Weaknesses & Red Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              {report.weaknesses.map((weakness, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span>{weakness}</span>
                </li>
              ))}
              {report.weaknesses.length === 0 && <p className="text-sm text-muted-foreground">No major weaknesses identified!</p>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-orange-50/50 dark:bg-orange-900/10 pb-4">
            <CardTitle className="text-orange-700 dark:text-orange-400 text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Skill Gaps to Address
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {report.skillGaps.map((gap, i) => (
                <span key={i} className="px-3 py-1 bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-300 text-xs font-medium rounded-full border border-orange-200 dark:border-orange-500/20">
                  {gap}
                </span>
              ))}
              {report.skillGaps.length === 0 && <p className="text-sm text-muted-foreground">Your skillset perfectly matches the requirements!</p>}
            </div>

            {report.sectionReasons && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Scoring Breakdown</p>
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-semibold text-slate-800 dark:text-slate-200">Skills:</span> {report.sectionReasons.skills}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-semibold text-slate-800 dark:text-slate-200">Experience:</span> {report.sectionReasons.experience}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-semibold text-slate-800 dark:text-slate-200">Projects:</span> {report.sectionReasons.projects}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
