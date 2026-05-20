// Keyword Heatmap - Visual representation of keyword matches

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { KeywordMatch } from '../../../../shared/atsTypes';

interface KeywordHeatmapProps {
    matchedKeywords: KeywordMatch[];
    missingKeywords: string[];
}

export default function KeywordHeatmap({ matchedKeywords, missingKeywords }: KeywordHeatmapProps) {
    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'technical':
                return 'bg-blue-500 hover:bg-blue-600';
            case 'soft':
                return 'bg-green-500 hover:bg-green-600';
            case 'domain':
                return 'bg-purple-500 hover:bg-purple-600';
            default:
                return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const getRelevanceOpacity = (relevanceScore: number) => {
        // Higher relevance = more opaque
        const normalized = Math.min(1, relevanceScore / 10); // Assuming max relevance ~ 10
        if (normalized > 0.7) return 'opacity-100';
        if (normalized > 0.4) return 'opacity-80';
        return 'opacity-60';
    };

    // Sort matched keywords by relevance
    const sortedMatched = [...matchedKeywords].sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Group by category
    const groupedKeywords = sortedMatched.reduce((acc, keyword) => {
        if (!acc[keyword.category]) {
            acc[keyword.category] = [];
        }
        acc[keyword.category].push(keyword);
        return acc;
    }, {} as Record<string, KeywordMatch[]>);

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Keyword Heatmap</h3>
                    <p className="text-sm text-muted-foreground">
                        Color intensity indicates keyword importance. Darker = more relevant.
                    </p>
                </div>

                {/* Matched Keywords by Category */}
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Matched Keywords ({matchedKeywords.length})
                    </h4>

                    {Object.entries(groupedKeywords).map(([category, keywords]: [string, KeywordMatch[]]) => (
                        <div key={category} className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground capitalize">
                                {category} ({keywords.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {keywords.map((keyword: KeywordMatch, idx: number) => (
                                    <Badge
                                        key={idx}
                                        className={`${getCategoryColor(keyword.category)} ${getRelevanceOpacity(keyword.relevanceScore)} text-white border-0`}
                                    >
                                        {keyword.keyword}
                                        {keyword.frequency > 1 && (
                                            <span className="ml-1 text-xs opacity-75">×{keyword.frequency}</span>
                                        )}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ))}

                    {matchedKeywords.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No matched keywords found
                        </p>
                    )}
                </div>

                {/* Missing Keywords */}
                {missingKeywords.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            Missing Keywords ({Math.min(15, missingKeywords.length)})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {missingKeywords.slice(0, 15).map((keyword, idx) => (
                                <Badge
                                    key={idx}
                                    variant="outline"
                                    className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                    {keyword}
                                </Badge>
                            ))}
                            {missingKeywords.length > 15 && (
                                <Badge variant="outline" className="text-muted-foreground">
                                    +{missingKeywords.length - 15} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="pt-4 border-t">
                    <p className="text-xs font-medium mb-2">Category Legend:</p>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-500" />
                            <span className="text-xs">Technical</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-purple-500" />
                            <span className="text-xs">Domain</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500" />
                            <span className="text-xs">Soft Skills</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-500" />
                            <span className="text-xs">Other</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
