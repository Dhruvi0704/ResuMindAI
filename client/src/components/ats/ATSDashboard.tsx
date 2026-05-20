// ATS Dashboard - Main results dashboard with tabbed interface

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, FileText, TrendingUp, Lightbulb, Activity } from 'lucide-react';
import type { ATSAnalysisResult, ATSRecommendation, SkillGap } from '../../../../shared/atsTypes';
import ScoreComparisonCard from './ScoreComparisonCard';
import SkillGapAnalysis from './SkillGapAnalysis';
import KeywordHeatmap from './KeywordHeatmap';
import ATSScoreCircle from '../ATSScoreCircle';

interface ATSDashboardProps {
    result: ATSAnalysisResult;
    onExport?: () => void;
}

export default function ATSDashboard({ result, onExport }: ATSDashboardProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default:
                return 'text-green-600 bg-green-50 border-green-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Export Button */}
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">ATS Analysis Results</h2>
                        <p className="text-sm text-muted-foreground">
                            Comprehensive AI-powered resume screening • Processed in {result.processingTime}ms
                        </p>
                    </div>
                    {onExport && (
                        <Button onClick={onExport} variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Export Report
                        </Button>
                    )}
                </div>
            </Card>

            {/* Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="gap-2">
                        <Activity className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="keywords" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Keywords
                    </TabsTrigger>
                    <TabsTrigger value="semantic" className="gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Semantic
                    </TabsTrigger>
                    <TabsTrigger value="recommendations" className="gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Advice
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Final Score */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-center">Final ATS Score</h3>
                            <div className="flex justify-center">
                                <ATSScoreCircle score={result.finalScore} />
                            </div>
                            <p className="text-center text-sm text-muted-foreground mt-4">
                                {result.finalScore >= 80
                                    ? 'Excellent! Your resume is highly optimized for ATS.'
                                    : result.finalScore >= 60
                                        ? 'Good match, but there is room for improvement.'
                                        : 'Consider optimizing your resume for better ATS compatibility.'}
                            </p>
                        </Card>

                        {/* Quick Stats */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-sm text-muted-foreground">Resume Word Count</span>
                                    <span className="font-semibold">{result.resumeWordCount}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-sm text-muted-foreground">JD Word Count</span>
                                    <span className="font-semibold">{result.jdWordCount}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-sm text-muted-foreground">Keywords Matched</span>
                                    <span className="font-semibold text-green-600">
                                        {result.keywordScore.matchedKeywords.length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-sm text-muted-foreground">Keywords Missing</span>
                                    <span className="font-semibold text-red-600">
                                        {result.keywordScore.missingKeywords.length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Skill Gaps Identified</span>
                                    <span className="font-semibold">{result.skillGaps.length}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <ScoreComparisonCard
                        keywordScore={result.keywordScore.score}
                        semanticScore={result.semanticScore.score}
                        finalScore={result.finalScore}
                    />
                </TabsContent>

                {/* Keywords Tab */}
                <TabsContent value="keywords" className="space-y-6">
                    <KeywordHeatmap
                        matchedKeywords={result.keywordScore.matchedKeywords}
                        missingKeywords={result.keywordScore.missingKeywords}
                    />

                    <SkillGapAnalysis
                        skillGaps={result.skillGaps}
                        categoryBreakdown={result.keywordScore.categoryBreakdown}
                    />
                </TabsContent>

                {/* Semantic Tab */}
                <TabsContent value="semantic" className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Semantic Analysis Results</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Similarity Score</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="h-4 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                                                style={{ width: `${result.semanticScore.similarityPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-primary">
                                        {result.semanticScore.similarityPercentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {result.semanticScore.semanticStrengths.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2 text-green-700">Semantic Strengths</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.semanticScore.semanticStrengths.map((strength: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                                            >
                                                {strength}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.semanticScore.contextualMatches.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Contextual Matches</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.semanticScore.contextualMatches.slice(0, 15).map((match: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                                            >
                                                {match}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.semanticScore.semanticGaps.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2 text-red-700">Semantic Gaps</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.semanticScore.semanticGaps.map((gap: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"
                                            >
                                                {gap}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Personalized Recommendations</h3>
                        <div className="space-y-3">
                            {result.recommendations.map((rec: ATSRecommendation, idx: number) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Lightbulb className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold uppercase">{rec.category}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-white border">
                                                    {rec.priority} priority
                                                </span>
                                            </div>
                                            <p className="text-sm">{rec.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {result.skillGaps.filter((g: SkillGap) => g.priority === 'high').length > 0 && (
                        <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                            <h4 className="font-semibold mb-3 text-red-900">Action Items</h4>
                            <ul className="space-y-2 text-sm text-red-800">
                                {result.skillGaps
                                    .filter((g: SkillGap) => g.priority === 'high')
                                    .slice(0, 5)
                                    .map((gap: SkillGap, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="text-red-600 mt-0.5">•</span>
                                            <span>
                                                Add <strong>{gap.skill}</strong> if you have this skill
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
