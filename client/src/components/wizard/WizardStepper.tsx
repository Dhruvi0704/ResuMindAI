import { WizardStep } from '@/types/resume';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStepperProps {
    currentStep: WizardStep;
    completedSteps: WizardStep[];
    onStepClick: (step: WizardStep) => void;
}

const steps: { id: WizardStep; label: string; number: number }[] = [
    { id: 'personal', label: 'Personal Info', number: 1 },
    { id: 'education', label: 'Education', number: 2 },
    { id: 'skills', label: 'Skills', number: 3 },
    { id: 'experience', label: 'Experience', number: 4 },
    { id: 'projects', label: 'Projects', number: 5 },
    { id: 'certifications', label: 'Certifications', number: 6 },
    { id: 'links', label: 'Links & Socials', number: 7 },
    { id: 'review', label: 'Review & Download', number: 8 },
];

export default function WizardStepper({ currentStep, completedSteps, onStepClick }: WizardStepperProps) {
    const currentStepIndex = steps.findIndex(s => s.id === currentStep);
    const completionPercentage = ((completedSteps.length) / steps.length) * 100;

    return (
        <div className="w-full mb-8">
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        Resume Progress
                    </span>
                    <span className="text-sm font-semibold text-primary">
                        {Math.round(completionPercentage)}% Complete
                    </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Stepper */}
            <div className="relative">
                {/* Connection Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-border hidden lg:block" />

                <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-4 relative">
                    {steps.map((step, index) => {
                        const isCompleted = completedSteps.includes(step.id);
                        const isCurrent = step.id === currentStep;
                        const isClickable = index <= currentStepIndex || isCompleted;

                        return (
                            <button
                                key={step.id}
                                onClick={() => isClickable && onStepClick(step.id)}
                                disabled={!isClickable}
                                className={cn(
                                    "flex flex-col items-center gap-2 transition-all duration-200",
                                    isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                                )}
                            >
                                {/* Step Circle */}
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 relative z-10",
                                        isCurrent && "ring-4 ring-primary/20 scale-110",
                                        isCompleted && "bg-primary text-primary-foreground shadow-lg",
                                        !isCompleted && !isCurrent && "bg-secondary text-muted-foreground",
                                        !isCompleted && isCurrent && "bg-primary text-primary-foreground shadow-lg"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span>{step.number}</span>
                                    )}
                                </div>

                                {/* Step Label */}
                                <span
                                    className={cn(
                                        "text-xs text-center font-medium transition-colors duration-200 hidden sm:block",
                                        isCurrent && "text-foreground font-semibold",
                                        !isCurrent && "text-muted-foreground"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Step Indicator */}
            <div className="mt-4 text-center sm:hidden">
                <p className="text-sm font-medium">
                    Step {currentStepIndex + 1} of {steps.length}:{' '}
                    <span className="text-primary">{steps[currentStepIndex].label}</span>
                </p>
            </div>
        </div>
    );
}
