// Analysis Progress Indicator - Multi-phase progress visualization

import { Card } from '@/components/ui/card';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface AnalysisPhase {
    id: string;
    name: string;
    status: 'pending' | 'processing' | 'complete';
}

interface AnalysisProgressIndicatorProps {
    phases: AnalysisPhase[];
}

export default function AnalysisProgressIndicator({ phases }: AnalysisProgressIndicatorProps) {
    return (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Analyzing Resume...</h3>

                <div className="space-y-3">
                    {phases.map((phase, index) => (
                        <div key={phase.id} className="flex items-center gap-3">
                            {/* Status Icon */}
                            <div className="flex-shrink-0">
                                {phase.status === 'complete' ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                ) : phase.status === 'processing' ? (
                                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                ) : (
                                    <Circle className="w-6 h-6 text-muted-foreground opacity-30" />
                                )}
                            </div>

                            {/* Phase Info */}
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${phase.status === 'complete' ? 'text-green-700' :
                                        phase.status === 'processing' ? 'text-primary' :
                                            'text-muted-foreground'
                                    }`}>
                                    {phase.name}
                                </p>
                                {phase.status === 'processing' && (
                                    <p className="text-xs text-muted-foreground">In progress...</p>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="hidden md:block flex-1">
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${phase.status === 'complete' ? 'bg-green-500 w-full' :
                                                phase.status === 'processing' ? 'bg-primary w-1/2 animate-pulse' :
                                                    'bg-transparent w-0'
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Overall Progress */}
                <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-medium">
                            {phases.filter(p => p.status === 'complete').length} / {phases.length} complete
                        </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                            style={{
                                width: `${(phases.filter(p => p.status === 'complete').length / phases.length) * 100}%`
                            }}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
}
