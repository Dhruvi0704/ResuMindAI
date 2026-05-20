import { useState } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    validateFullName,
    validateJobTitle,
    validateEmail,
    validatePhone,
    validateLocation,
    sanitizeAlphabetsAndSpaces,
    sanitizeDigits,
    sanitizeLocation,
} from '@/utils/validationUtils';

interface PersonalInfoStepProps {
    onNext: () => void;
}

export default function PersonalInfoStep({ onNext }: PersonalInfoStepProps) {
    const { state, dispatch } = useResume();
    const { personal } = state.resumeData;
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof typeof personal, value: string) => {
        dispatch({
            type: 'UPDATE_PERSONAL',
            payload: { [field]: value },
        });
    };

    const validateField = (field: keyof typeof personal, value: string) => {
        let validationResult;

        switch (field) {
            case 'fullName':
                validationResult = validateFullName(value);
                break;
            case 'jobTitle':
                validationResult = validateJobTitle(value);
                break;
            case 'email':
                validationResult = validateEmail(value);
                break;
            case 'phone':
                validationResult = validatePhone(value);
                break;
            case 'location':
                validationResult = validateLocation(value);
                break;
            default:
                return;
        }

        if (validationResult.isValid) {
            // Clear error from local state
            setFieldErrors(prev => {
                const { [field]: _, ...rest } = prev;
                return rest;
            });
            // Clear error from global context
            dispatch({ type: 'CLEAR_VALIDATION_ERROR', payload: `personal.${field}` });
        } else {
            // Set error in local state
            setFieldErrors(prev => ({ ...prev, [field]: validationResult.error || '' }));
            // Set error in global context
            dispatch({
                type: 'SET_VALIDATION_ERROR',
                payload: { field: `personal.${field}`, error: validationResult.error || '' },
            });
        }
    };

    const handleInputChange = (field: keyof typeof personal, value: string, sanitize?: 'alpha' | 'digits' | 'location') => {
        let sanitizedValue = value;

        if (sanitize === 'alpha') {
            sanitizedValue = sanitizeAlphabetsAndSpaces(value);
        } else if (sanitize === 'digits') {
            sanitizedValue = sanitizeDigits(value);
            // Limit phone to 10 digits
            if (sanitizedValue.length > 10) {
                sanitizedValue = sanitizedValue.slice(0, 10);
            }
        } else if (sanitize === 'location') {
            sanitizedValue = sanitizeLocation(value);
        }

        handleChange(field, sanitizedValue);
        validateField(field, sanitizedValue);
    };

    const handleGenerateSummary = async () => {
        if (!personal.jobTitle) {
            toast({
                title: 'Job Title Required',
                description: 'Please enter your target job title first.',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobTitle: personal.jobTitle,
                    name: personal.fullName,
                }),
            });

            if (!response.ok) throw new Error('Failed to generate summary');

            const data = await response.json();
            handleChange('professionalSummary', data.summary);

            if (data.summary === "Unable to generate summary. Please try again.") {
                toast({
                    title: 'Generation Failed',
                    description: 'Could not generate summary due to API limits. Please try again later.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Summary Generated!',
                    description: 'Your professional summary has been created.',
                });
            }
        } catch (error) {
            toast({
                title: 'Generation Failed',
                description: 'Could not generate summary. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const isValid = () => {
        const hasRequiredFields =
            personal.fullName.trim() !== '' &&
            personal.jobTitle.trim() !== '' &&
            personal.email.trim() !== '' &&
            personal.phone.trim() !== '' &&
            personal.location.trim() !== '';

        const hasNoErrors = Object.keys(fieldErrors).length === 0;

        return hasRequiredFields && hasNoErrors;
    };



    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
                    <p className="text-muted-foreground">
                        Let's start with your basic information. This will appear at the top of your resume.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="fullName">
                            Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            value={personal.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value, 'alpha')}
                            onBlur={() => validateField('fullName', personal.fullName)}
                            placeholder="Suresh Kumar"
                            className={`mt-1 ${fieldErrors.fullName ? 'border-destructive' : ''}`}
                        />
                        {fieldErrors.fullName && (
                            <p className="text-xs text-destructive mt-1">{fieldErrors.fullName}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="jobTitle">
                            Target Job Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="jobTitle"
                            value={personal.jobTitle}
                            onChange={(e) => handleInputChange('jobTitle', e.target.value, 'alpha')}
                            onBlur={() => validateField('jobTitle', personal.jobTitle)}
                            placeholder="Software Engineer"
                            className={`mt-1 ${fieldErrors.jobTitle ? 'border-destructive' : ''}`}
                        />
                        {fieldErrors.jobTitle && (
                            <p className="text-xs text-destructive mt-1">{fieldErrors.jobTitle}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="email">
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={personal.email}
                            onChange={(e) => {
                                handleChange('email', e.target.value);
                                validateField('email', e.target.value);
                            }}
                            onBlur={() => validateField('email', personal.email)}
                            placeholder="suresh.kumar@example.com"
                            className={`mt-1 ${fieldErrors.email ? 'border-destructive' : ''}`}
                        />
                        {fieldErrors.email && (
                            <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="phone">
                            Phone <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={personal.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value, 'digits')}
                            onBlur={() => validateField('phone', personal.phone)}
                            placeholder="1234567890"
                            className={`mt-1 ${fieldErrors.phone ? 'border-destructive' : ''}`}
                            maxLength={10}
                        />
                        {fieldErrors.phone && (
                            <p className="text-xs text-destructive mt-1">{fieldErrors.phone}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="location">
                            Location <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="location"
                            value={personal.location}
                            onChange={(e) => handleInputChange('location', e.target.value, 'location')}
                            onBlur={() => validateField('location', personal.location)}
                            placeholder="Mumbai"
                            className={`mt-1 ${fieldErrors.location ? 'border-destructive' : ''}`}
                        />
                        {fieldErrors.location && (
                            <p className="text-xs text-destructive mt-1">{fieldErrors.location}</p>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="professionalSummary">Professional Summary</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateSummary}
                            disabled={isGenerating || !personal.jobTitle}
                            className="h-8"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-3 h-3 mr-2" />
                                    Generate with AI
                                </>
                            )}
                        </Button>
                    </div>
                    <Textarea
                        id="professionalSummary"
                        value={personal.professionalSummary}
                        onChange={(e) => handleChange('professionalSummary', e.target.value)}
                        placeholder="A brief summary highlighting your key strengths and career objectives..."
                        className="mt-1 min-h-[120px]"
                    />
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground">
                            Write a compelling summary that highlights your expertise
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={onNext} disabled={!isValid()} size="lg">
                        Continue to Education
                    </Button>
                </div>
            </div>
        </Card>
    );
}
