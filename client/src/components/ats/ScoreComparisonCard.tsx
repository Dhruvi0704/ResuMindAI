// Score Comparison Card - Displays Keyword vs Semantic scores side-by-side

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreComparisonCardProps {
    keywordScore: number;
    semanticScore: number;
    finalScore: number;
}

export default function ScoreComparisonCard({
    keywordScore,
    semanticScore,
    finalScore,
}: ScoreComparisonCardProps) {
    const scoreDiff = semanticScore - keywordScore;
    const absDiff = Math.abs(scoreDiff);

    const getDiffIcon = () => {
        if (absDiff < 5) return <Minus className="w-4 h-4 text-yellow-500" />;
        if (scoreDiff > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
        return <TrendingDown className="w-4 h-4 text-red-500" />;
    };

    const getDiffText = () => {
        if (absDiff < 5) return 'Similar scores';
        if (scoreDiff > 0) return `Semantic +${absDiff}`;
        return `Keyword +${absDiff}`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getProgressColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Dual Scoring Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                        Comparing keyword matching vs semantic understanding
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Keyword Score */}
                    <div className="space-y-3">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Keyword Match</p>
                            <div className={`text-4xl font-bold ${getScoreColor(keywordScore)}`}>
                                {keywordScore}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Rule-based NLP</p>
                        </div>
                        <Progress value={keywordScore} className="h-2" indicatorClassName={getProgressColor(keywordScore)} />
                        <div className="text-xs text-center text-muted-foreground">
                            TF-IDF weighted keyword analysis
                        </div>
                    </div>

                    {/* Score Difference */}
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            {getDiffIcon()}
                            <span>{getDiffText()}</span>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{finalScore}</div>
                            <p className="text-xs text-muted-foreground">Combined Score</p>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">60% keyword + 40% semantic</p>
                    </div>

                    {/* Semantic Score */}
                    <div className="space-y-3">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Semantic Match</p>
                            <div className={`text-4xl font-bold ${getScoreColor(semanticScore)}`}>
                                {semanticScore}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">AI-powered SBERT</p>
                        </div>
                        <Progress value={semanticScore} className="h-2" indicatorClassName={getProgressColor(semanticScore)} />
                        <div className="text-xs text-center text-muted-foreground">
                            Contextual similarity analysis
                        </div>
                    </div>
                </div>

                {/* Insights */}
                <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium mb-1">What this means:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• Keyword score shows direct word matches</li>
                                <li>• Semantic score captures context and meaning</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium mb-1">Score interpretation:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• 80+ : Excellent match</li>
                                <li>• 60-79 : Good, needs improvement</li>
                                <li>• &lt;60 : Significant gaps</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
