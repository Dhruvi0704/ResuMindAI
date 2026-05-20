// Skill Gap Analysis Component - Displays missing skills by category with priority

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Code, Users, Briefcase, Package } from 'lucide-react';
import type { SkillGap, SkillCategory } from '../../../../shared/atsTypes';

interface SkillGapAnalysisProps {
    skillGaps: SkillGap[];
    categoryBreakdown: {
        technical: { matched: number; total: number };
        soft: { matched: number; total: number };
        domain: { matched: number; total: number };
        other: { matched: number; total: number };
    };
}

export default function SkillGapAnalysis({ skillGaps, categoryBreakdown }: SkillGapAnalysisProps) {
    const getCategoryIcon = (category: SkillCategory) => {
        switch (category) {
            case 'technical':
                return <Code className="w-4 h-4" />;
            case 'soft':
                return <Users className="w-4 h-4" />;
            case 'domain':
                return <Briefcase className="w-4 h-4" />;
            default:
                return <Package className="w-4 h-4" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'destructive';
            case 'medium':
                return 'default';
            default:
                return 'secondary';
        }
    };

    const getCategoryColor = (category: SkillCategory) => {
        switch (category) {
            case 'technical':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'soft':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'domain':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getMatchPercentage = (matched: number, total: number) => {
        return total > 0 ? Math.round((matched / total) * 100) : 0;
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Skill Gap Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                        Skills from the job description that could strengthen your resume
                    </p>
                </div>

                {/* Category Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(categoryBreakdown).map(([category, data]) => {
                        const percentage = getMatchPercentage(data.matched, data.total);
                        const cat = category as SkillCategory;

                        return (
                            <div key={category} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded ${getCategoryColor(cat)}`}>
                                        {getCategoryIcon(cat)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium capitalize">{category}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {data.matched}/{data.total}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-center font-medium">{percentage}%</p>
                            </div>
                        );
                    })}
                </div>

                {/* Missing Skills by Priority */}
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Missing Skills by Priority</h4>

                    {['high', 'medium', 'low'].map((priority) => {
                        const gaps = skillGaps.filter((g) => g.priority === priority);

                        if (gaps.length === 0) return null;

                        return (
                            <div key={priority} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {priority === 'high' ? (
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                    ) : priority === 'medium' ? (
                                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    )}
                                    <span className="text-sm font-medium capitalize">{priority} Priority</span>
                                    <span className="text-xs text-muted-foreground">({gaps.length} skills)</span>
                                </div>

                                <div className="flex flex-wrap gap-2 pl-6">
                                    {gaps.map((gap, idx) => (
                                        <Badge
                                            key={idx}
                                            variant={getPriorityColor(gap.priority) as any}
                                            className="text-xs"
                                        >
                                            <span className="mr-1">{getCategoryIcon(gap.category)}</span>
                                            {gap.skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {skillGaps.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                            <p className="text-sm">Great! No significant skill gaps detected.</p>
                        </div>
                    )}
                </div>

                {/* Recommendations */}
                {skillGaps.length > 0 && (
                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            <strong>Tip:</strong> Focus on high-priority technical and domain skills first.
                            If you have these skills but didn't mention them, add them to your resume.
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}
