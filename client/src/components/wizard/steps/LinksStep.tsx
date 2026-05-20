import { useEffect, useState } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Linkedin, Github, Globe, Code, Trophy, Twitter } from 'lucide-react';
import { validateUrl } from '@/utils/validationUtils';

interface LinksStepProps {
    onNext: () => void;
    onBack: () => void;
}

const socialPlatforms = [
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
    { key: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/username' },
    { key: 'portfolio', label: 'Portfolio Website', icon: Globe, placeholder: 'https://yourportfolio.com' },
    { key: 'leetcode', label: 'LeetCode', icon: Code, placeholder: 'https://leetcode.com/username' },
    { key: 'kaggle', label: 'Kaggle', icon: Trophy, placeholder: 'https://kaggle.com/username' },
    { key: 'twitter', label: 'Twitter/X', icon: Twitter, placeholder: 'https://twitter.com/username' },
] as const;

export default function LinksStep({ onNext, onBack }: LinksStepProps) {
    const { state, dispatch } = useResume();
    const { socialLinks } = state.resumeData;
    const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});

    const handleChange = (key: keyof typeof socialLinks, value: string) => {
        dispatch({
            type: 'UPDATE_SOCIAL_LINKS',
            payload: { [key]: value },
        });

        // Validate on change
        validateUrlField(key, value);
    };

    const validateUrlField = (key: string, url: string) => {
        const platform = socialPlatforms.find(p => p.key === key);
        const fieldName = platform?.label || 'URL';

        const validationResult = validateUrl(url, fieldName);

        if (validationResult.isValid) {
            // Clear error from local state
            setUrlErrors(prev => {
                const { [key]: _, ...rest } = prev;
                return rest;
            });
            // Clear error from global context
            dispatch({ type: 'CLEAR_VALIDATION_ERROR', payload: `socialLinks.${key}` });
        } else if (url.trim() !== '') {
            // Only show error if URL is not empty (URLs are optional)
            // Set error in local state
            setUrlErrors(prev => ({ ...prev, [key]: validationResult.error || '' }));
            // Set error in global context
            dispatch({
                type: 'SET_VALIDATION_ERROR',
                payload: { field: `socialLinks.${key}`, error: validationResult.error || '' },
            });
        }
    };

    // Validate all URLs on mount if they exist
    useEffect(() => {
        Object.entries(socialLinks).forEach(([key, value]) => {
            if (value && value.trim() !== '') {
                validateUrlField(key, value);
            }
        });
    }, []); // Run only once on mount

    const hasAtLeastOneLink = Object.values(socialLinks).some(link => link && link.trim() !== '');

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Links & Social Profiles</h2>
                    <p className="text-muted-foreground">
                        Add links to your professional profiles. These will be clickable in your resume.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {socialPlatforms.map(({ key, label, icon: Icon, placeholder }) => {
                        const value = socialLinks[key] || '';
                        const error = urlErrors[key];

                        return (
                            <div key={key}>
                                <Label htmlFor={key} className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    {label}
                                    <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id={key}
                                    type="url"
                                    value={value}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    onBlur={() => validateUrlField(key, value)}
                                    placeholder={placeholder}
                                    className={`mt-1 ${error ? 'border-destructive' : ''}`}
                                />
                                {error && (
                                    <p className="text-xs text-destructive mt-1">{error}</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-sm mb-2">💡 Pro Tips</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Include your LinkedIn profile to showcase your professional network</li>
                        <li>• Add your GitHub to highlight your coding projects</li>
                        <li>• Portfolio websites make a great impression for creative roles</li>
                        <li>• Competitive programming profiles (LeetCode, Kaggle) are great for tech roles</li>
                        <li>• All URLs must start with https:// for security</li>
                    </ul>
                </div>

                <div className="flex justify-between pt-4 border-t">
                    <Button onClick={onBack} variant="outline" size="lg">
                        Back
                    </Button>
                    <Button onClick={onNext} size="lg">
                        Review & Download
                    </Button>
                </div>
            </div>
        </Card>
    );
}
