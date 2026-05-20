import { useState } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { WizardStep } from '@/types/resume';
import WizardStepper from './WizardStepper';
import PersonalInfoStep from './steps/PersonalInfoStep';
import EducationStep from './steps/EducationStep';
import SkillsStep from './steps/SkillsStep';
import ExperienceStep from './steps/ExperienceStep';
import ProjectsStep from './steps/ProjectsStep';
import CertificationsStep from './steps/CertificationsStep';
import LinksStep from './steps/LinksStep';
import ReviewStep from './steps/ReviewStep';

const stepOrder: WizardStep[] = [
    'personal',
    'education',
    'skills',
    'experience',
    'projects',
    'certifications',
    'links',
    'review',
];

export default function ResumeWizard() {
    const { state, dispatch } = useResume();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const currentStep = stepOrder[currentStepIndex];

    const handleNext = () => {
        // Mark current step as complete
        dispatch({ type: 'MARK_STEP_COMPLETE', payload: currentStep });

        if (currentStepIndex < stepOrder.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
            dispatch({ type: 'SET_STEP', payload: stepOrder[currentStepIndex + 1] });
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
            dispatch({ type: 'SET_STEP', payload: stepOrder[currentStepIndex - 1] });
        }
    };

    const handleStepClick = (step: WizardStep) => {
        const stepIndex = stepOrder.indexOf(step);
        if (stepIndex !== -1) {
            setCurrentStepIndex(stepIndex);
            dispatch({ type: 'SET_STEP', payload: step });
        }
    };

    const handleEditStep = (step: string) => {
        const stepIndex = stepOrder.indexOf(step as WizardStep);
        if (stepIndex !== -1) {
            setCurrentStepIndex(stepIndex);
            dispatch({ type: 'SET_STEP', payload: step as WizardStep });
        }
    };

    return (
        <div className="w-full">
            <WizardStepper
                currentStep={currentStep}
                completedSteps={state.completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="mt-8">
                {currentStep === 'personal' && <PersonalInfoStep onNext={handleNext} />}
                {currentStep === 'education' && <EducationStep onNext={handleNext} onBack={handleBack} />}
                {currentStep === 'skills' && <SkillsStep onNext={handleNext} onBack={handleBack} />}
                {currentStep === 'experience' && <ExperienceStep onNext={handleNext} onBack={handleBack} />}
                {currentStep === 'projects' && <ProjectsStep onNext={handleNext} onBack={handleBack} />}
                {currentStep === 'certifications' && <CertificationsStep onNext={handleNext} onBack={handleBack} />}
                {currentStep === 'links' && <LinksStep onNext={handleNext} onBack={handleBack} />}
                {currentStep === 'review' && <ReviewStep onBack={handleBack} onEditStep={handleEditStep} />}
            </div>
        </div>
    );
}
