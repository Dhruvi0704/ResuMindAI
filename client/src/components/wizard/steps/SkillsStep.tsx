import { useState } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, X, Wand2, Loader2 } from 'lucide-react';
import { generateId, SkillCategory, SkillLevel } from '@/types/resume';
import type { Skill } from '@/types/resume';
import { validateSkill, sanitizeAlphabetsAndSpaces } from '@/utils/validationUtils';
import { useToast } from '@/hooks/use-toast';

interface SkillsStepProps {
    onNext: () => void;
    onBack: () => void;
}

const skillSuggestions: Record<SkillCategory, string[]> = {
    programming: [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
        'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'SQL'
    ],
    frameworks: [
        'React', 'Angular', 'Vue.js', 'Next.js', 'Node.js', 'Express', 'Django',
        'Flask', 'Spring Boot', 'ASP.NET', 'Laravel', 'Ruby on Rails', 'FastAPI'
    ],
    tools: [
        'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Jenkins', 'CI/CD',
        'Terraform', 'Ansible', 'MongoDB', 'PostgreSQL', 'Redis', 'Elasticsearch'
    ],
    soft: [
        'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration',
        'Project Management', 'Agile', 'Scrum', 'Critical Thinking', 'Adaptability'
    ],
};

const categoryLabels: Record<SkillCategory, string> = {
    programming: 'Programming Languages',
    frameworks: 'Frameworks & Libraries',
    tools: 'Tools & Technologies',
    soft: 'Soft Skills',
};

export default function SkillsStep({ onNext, onBack }: SkillsStepProps) {
    const { state, dispatch } = useResume();
    const { skills } = state.resumeData;

    const [newSkillName, setNewSkillName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('programming');
    const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('intermediate');
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [skillError, setSkillError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const { toast } = useToast();

    const handleInputChange = (value: string) => {
        // Sanitize input to allow only alphabets and spaces
        const sanitizedValue = sanitizeAlphabetsAndSpaces(value);
        setNewSkillName(sanitizedValue);

        // Validate the skill name
        const validation = validateSkill(sanitizedValue);
        if (!validation.isValid && sanitizedValue.trim() !== '') {
            setSkillError(validation.error || '');
        } else {
            setSkillError('');
        }

        if (sanitizedValue.trim()) {
            const suggestions = skillSuggestions[selectedCategory].filter(skill =>
                skill.toLowerCase().includes(sanitizedValue.toLowerCase())
            );
            setFilteredSuggestions(suggestions);
        } else {
            setFilteredSuggestions([]);
        }
    };

    const handleAddSkill = (skillName?: string) => {
        const name = (skillName || newSkillName || "").trim();
        if (!name) return;

        // Validate skill name
        const validation = validateSkill(name);
        if (!validation.isValid) {
            setSkillError(validation.error || 'Invalid skill name');
            return;
        }

        // Check if skill already exists
        if (skills.some(s => (s?.name || "").toLowerCase() === name.toLowerCase())) {
            setSkillError('This skill has already been added');
            return;
        }

        const newSkill: Skill = {
            id: generateId(),
            name: name.trim(),
            category: selectedCategory,
            level: selectedLevel,
        };

        dispatch({ type: 'ADD_SKILL', payload: newSkill });
        setNewSkillName('');
        setFilteredSuggestions([]);
        setSkillError('');
    };

    const handleDeleteSkill = (id: string) => {
        dispatch({ type: 'DELETE_SKILL', payload: id });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const skillsByCategory = skills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
    }, {} as Record<SkillCategory, Skill[]>);

    const getLevelColor = (level: SkillLevel) => {
        switch (level) {
            case 'beginner': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'advanced': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        }
    };

    const handleSuggestSkills = async () => {
        if (!state.resumeData.personal.jobTitle) {
            toast({
                title: 'Job Title Required',
                description: 'Please go back to the Personal Info step and enter a Target Job Title first.',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/suggest-skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobTitle: state.resumeData.personal.jobTitle }),
            });

            if (!response.ok) throw new Error('Failed to fetch suggestions');

            const data = await response.json();
            setAiSuggestions(data.skills || []);

            toast({
                title: 'Skills Suggested!',
                description: 'AI has generated some recommended skills for your role.',
            });
        } catch (error) {
            toast({
                title: 'Generation Failed',
                description: 'Could not generate skills. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Skills</h2>
                        <p className="text-muted-foreground">
                            Add your skills organized by category. Select the proficiency level for each skill.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleSuggestSkills}
                        disabled={isGenerating || !state.resumeData.personal.jobTitle}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 mr-2 text-primary" />
                                Suggest AI Skills
                            </>
                        )}
                    </Button>
                </div>

                {/* AI Suggestions Display */}
                {aiSuggestions.length > 0 && (
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <h3 className="text-sm font-semibold mb-3 flex items-center">
                            <Wand2 className="w-4 h-4 mr-2 text-primary" />
                            Suggested Skills for {state.resumeData.personal.jobTitle}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {aiSuggestions.map((skill, idx) => {
                                const isAdded = skills.some(s => (s?.name || "").toLowerCase() === skill.toLowerCase());
                                return (
                                    <Badge
                                        key={idx}
                                        variant={isAdded ? "secondary" : "outline"}
                                        className={`cursor-pointer transition-colors ${isAdded
                                                ? 'opacity-50'
                                                : 'hover:bg-primary hover:text-primary-foreground border-primary/30'
                                            }`}
                                        onClick={() => {
                                            if (!isAdded) {
                                                setNewSkillName(skill);
                                                // Trigger focus or simply add it using the current category/level
                                            }
                                        }}
                                    >
                                        {skill}
                                        {!isAdded && <Plus className="w-3 h-3 ml-1" />}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Add Skill Form */}
                <Card className="p-4 bg-muted/50">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <Label className="text-xs">Category</Label>
                                <Select
                                    value={selectedCategory}
                                    onValueChange={(value) => setSelectedCategory(value as SkillCategory)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categoryLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">Skill Name</Label>
                                <div className="relative">
                                    <Input
                                        value={newSkillName}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type or select a skill..."
                                        className={`mt-1 ${skillError ? 'border-destructive' : ''}`}
                                    />
                                    {filteredSuggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                                            {filteredSuggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion}
                                                    onClick={() => handleAddSkill(suggestion)}
                                                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {skillError && (
                                    <p className="text-xs text-destructive mt-1">{skillError}</p>
                                )}
                            </div>

                            <div>
                                <Label className="text-xs">Proficiency Level</Label>
                                <Select
                                    value={selectedLevel}
                                    onValueChange={(value) => setSelectedLevel(value as SkillLevel)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button onClick={() => handleAddSkill()} className="w-full" variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Skill
                        </Button>
                    </div>
                </Card>

                {/* Skills Display by Category */}
                <div className="space-y-4">
                    {Object.entries(categoryLabels).map(([category, label]) => {
                        const categorySkills = skillsByCategory[category as SkillCategory] || [];
                        if (categorySkills.length === 0) return null;

                        return (
                            <div key={category}>
                                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">{label}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {categorySkills.map((skill) => (
                                        <Badge
                                            key={skill.id}
                                            variant="secondary"
                                            className={`${getLevelColor(skill.level)} pl-3 pr-1 py-1.5 flex items-center gap-2`}
                                        >
                                            <span>{skill.name}</span>
                                            <span className="text-xs opacity-70 capitalize">({skill.level})</span>
                                            <button
                                                onClick={() => handleDeleteSkill(skill.id)}
                                                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {skills.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No skills added yet. Start adding your skills above!</p>
                    </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                    <Button onClick={onBack} variant="outline" size="lg">
                        Back
                    </Button>
                    <Button onClick={onNext} size="lg" disabled={skills.length === 0}>
                        Continue to Experience
                    </Button>
                </div>
            </div>
        </Card>
    );
}
