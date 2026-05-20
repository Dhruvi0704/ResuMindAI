import { useState } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, GripVertical, Trash2, Wand2, Loader2, Plus as PlusCircle, X, Sparkles } from 'lucide-react';
import { generateId } from '@/types/resume';
import type { Experience } from '@/types/resume';
import { useToast } from '@/hooks/use-toast';
import {
    validateTextRequired,
    validateDateRequired,
    validateDateRange,
} from '@/utils/validationUtils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ExperienceStepProps {
    onNext: () => void;
    onBack: () => void;
}

const actionVerbs = [
    'Developed', 'Implemented', 'Designed', 'Led', 'Managed', 'Created', 'Built',
    'Optimized', 'Improved', 'Reduced', 'Increased', 'Achieved', 'Delivered',
    'Collaborated', 'Coordinated', 'Established', 'Launched', 'Spearheaded',
    'Streamlined', 'Transformed', 'Architected', 'Engineered', 'Automated'
];

function ExperienceCard({ experience, onUpdate, onDelete }: {
    experience: Experience;
    onUpdate: (data: Partial<Experience>) => void;
    onDelete: () => void;
}) {
    const { dispatch } = useResume();
    const { toast } = useToast();
    const [newResponsibility, setNewResponsibility] = useState('');
    const [enhancingNewResponsibility, setEnhancingNewResponsibility] = useState(false);
    const [pendingEnhancement, setPendingEnhancement] = useState<{ index?: number; text: string } | null>(null);
    const [showVerbSuggestions, setShowVerbSuggestions] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: experience.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleAddResponsibility = () => {
        if (!newResponsibility.trim()) return;
        onUpdate({
            responsibilities: [...experience.responsibilities, newResponsibility.trim()],
        });
        setNewResponsibility('');
    };

    const handleDeleteResponsibility = (index: number) => {
        onUpdate({
            responsibilities: experience.responsibilities.filter((_, i) => i !== index),
        });
    };

    const handleEnhanceNewResponsibility = async (actionType: "grammar" | "professional" | "shorten" | "enhance" = "enhance") => {
        if (!newResponsibility.trim()) return;
        setEnhancingNewResponsibility(true);

        try {
            const response = await fetch('/api/enhanced-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalText: newResponsibility,
                    sectionType: 'experience',
                    jobRole: experience.role || 'Professional', // Fallback if role is empty
                    actionType
                }),
            });

            if (!response.ok) throw new Error('Enhancement failed');

            const data = await response.json();
            
            setPendingEnhancement({
                text: data.enhancedText
            });

        } catch (error) {
            toast({
                title: 'Enhancement Failed',
                description: 'Could not enhance. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setEnhancingNewResponsibility(false);
        }
    };

    const confirmEnhancement = () => {
        if (!pendingEnhancement) return;
        
        if (pendingEnhancement.index !== undefined) {
             // We don't use this branch anymore since we removed it from existing items,
             // but keeping logic in case it's needed
             const updated = [...experience.responsibilities];
             updated[pendingEnhancement.index] = pendingEnhancement.text;
             onUpdate({ responsibilities: updated });
        } else {
             // For the new responsibility field
             setNewResponsibility(pendingEnhancement.text);
        }
        
        setPendingEnhancement(null);
        toast({
            title: 'Applied!',
            description: 'Your text has been updated.',
        });
    };

    const insertActionVerb = (verb: string) => {
        setNewResponsibility(verb + ' ');
        setShowVerbSuggestions(false);
    };

    const validateField = (field: string, value: string | boolean) => {
        let validationResult;
        const contextKey = `experience.${experience.id}.${field}`;

        switch (field) {
            case 'company':
                validationResult = validateTextRequired(value as string, 'Company', 2);
                break;
            case 'role':
                validationResult = validateTextRequired(value as string, 'Role', 2);
                break;
            case 'startDate':
                validationResult = validateDateRequired(value as string, 'Start date');
                // Validate date range if end date exists and not currently working
                if (validationResult.isValid && experience.endDate && !experience.current) {
                    const rangeResult = validateDateRange(value as string, experience.endDate);
                    if (!rangeResult.isValid) {
                        dispatch({ type: 'SET_VALIDATION_ERROR', payload: { field: `experience.${experience.id}.endDate`, error: rangeResult.error || '' } });
                    } else {
                        dispatch({ type: 'CLEAR_VALIDATION_ERROR', payload: `experience.${experience.id}.endDate` });
                    }
                }
                break;
            case 'endDate':
                if (!experience.current) {
                    validationResult = validateDateRequired(value as string, 'End date');
                    if (validationResult.isValid && experience.startDate) {
                        validationResult = validateDateRange(experience.startDate, value as string);
                    }
                } else {
                    validationResult = { isValid: true };
                }
                break;
            case 'current':
                // When toggling current, clear endDate error if current is true
                if (value as boolean) {
                    dispatch({ type: 'CLEAR_VALIDATION_ERROR', payload: `experience.${experience.id}.endDate` });
                    setFieldErrors(prev => {
                        const { endDate: _, ...rest } = prev;
                        return rest;
                    });
                }
                return;
            default:
                return;
        }

        if (validationResult.isValid) {
            setFieldErrors(prev => {
                const { [field]: _, ...rest } = prev;
                return rest;
            });
            dispatch({ type: 'CLEAR_VALIDATION_ERROR', payload: contextKey });
        } else {
            setFieldErrors(prev => ({ ...prev, [field]: validationResult.error || '' }));
            dispatch({
                type: 'SET_VALIDATION_ERROR',
                payload: { field: contextKey, error: validationResult.error || '' },
            });
        }
    };

    const handleInputChange = (field: keyof Experience, value: string | boolean) => {
        onUpdate({ [field]: value });
        validateField(field, value);
    };

    return (
        <div ref={setNodeRef} style={style} className="relative">
            <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                    <button
                        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-2"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="w-5 h-5" />
                    </button>

                    <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Company *</Label>
                                <Input
                                    value={experience.company}
                                    onChange={(e) => handleInputChange('company', e.target.value)}
                                    onBlur={() => validateField('company', experience.company)}
                                    placeholder="Company Name"
                                    className={`mt-1 ${fieldErrors.company ? 'border-destructive' : ''}`}
                                />
                                {fieldErrors.company && (
                                    <p className="text-xs text-destructive mt-1">{fieldErrors.company}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs">Role *</Label>
                                <Input
                                    value={experience.role}
                                    onChange={(e) => handleInputChange('role', e.target.value)}
                                    onBlur={() => validateField('role', experience.role)}
                                    placeholder="Software Engineer"
                                    className={`mt-1 ${fieldErrors.role ? 'border-destructive' : ''}`}
                                />
                                {fieldErrors.role && (
                                    <p className="text-xs text-destructive mt-1">{fieldErrors.role}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs">Start Date *</Label>
                                <Input
                                    type="month"
                                    value={experience.startDate}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                    onBlur={() => validateField('startDate', experience.startDate)}
                                    className={`mt-1 ${fieldErrors.startDate ? 'border-destructive' : ''}`}
                                />
                                {fieldErrors.startDate && (
                                    <p className="text-xs text-destructive mt-1">{fieldErrors.startDate}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs">End Date {!experience.current && '*'}</Label>
                                <div className="space-y-2">
                                    <Input
                                        type="month"
                                        value={experience.endDate}
                                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                                        onBlur={() => validateField('endDate', experience.endDate)}
                                        disabled={experience.current}
                                        className={`mt-1 ${fieldErrors.endDate ? 'border-destructive' : ''}`}
                                    />
                                    {fieldErrors.endDate && (
                                        <p className="text-xs text-destructive mt-1">{fieldErrors.endDate}</p>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`current-${experience.id}`}
                                            checked={experience.current}
                                            onCheckedChange={(checked) => handleInputChange('current', checked as boolean)}
                                        />
                                        <label
                                            htmlFor={`current-${experience.id}`}
                                            className="text-xs text-muted-foreground cursor-pointer"
                                        >
                                            Currently working here
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs">Responsibilities & Achievements</Label>
                            <div className="mt-2 space-y-2">
                                {experience.responsibilities.map((resp, index) => (
                                    <div key={index} className="flex gap-2 items-start group">
                                        <span className="text-muted-foreground mt-1">•</span>
                                        <p className="flex-1 text-sm">{resp}</p>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive"
                                                onClick={() => handleDeleteResponsibility(index)}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 relative">
                                <div className="flex gap-2 relative">
                                    <div className="flex-1 relative">
                                        <Textarea
                                            value={newResponsibility}
                                            onChange={(e) => setNewResponsibility(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && e.ctrlKey) {
                                                    handleAddResponsibility();
                                                }
                                            }}
                                            placeholder="Add a responsibility or achievement..."
                                            className="min-h-[70px] text-sm pr-20"
                                        />
                                        <div className="absolute top-1 right-1 flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => handleEnhanceNewResponsibility('grammar')}
                                                disabled={enhancingNewResponsibility || !newResponsibility.trim()}
                                                title="Fix Grammar"
                                                type="button"
                                            >
                                                {enhancingNewResponsibility ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                                )}
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        disabled={enhancingNewResponsibility || !newResponsibility.trim()}
                                                        title="Enhance"
                                                        type="button"
                                                    >
                                                        {enhancingNewResponsibility ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Wand2 className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEnhanceNewResponsibility('professional')}>
                                                        👔 Professional Tone
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEnhanceNewResponsibility('shorten')}>
                                                        ✂️ Shorten Sentence
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEnhanceNewResponsibility('enhance')}>
                                                        🪄 Auto-Enhance
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowVerbSuggestions(!showVerbSuggestions)}
                                            className="absolute bottom-1 right-1 h-6 text-[10px]"
                                        >
                                            Action Verbs
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={handleAddResponsibility}
                                        size="sm"
                                        className="h-auto"
                                        disabled={!newResponsibility.trim()}
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                    </Button>
                                </div>

                                {showVerbSuggestions && (
                                    <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-lg p-2 grid grid-cols-3 gap-1 max-h-48 overflow-auto">
                                        {actionVerbs.map((verb) => (
                                            <button
                                                key={verb}
                                                onClick={() => insertActionVerb(verb)}
                                                className="text-left px-2 py-1 hover:bg-accent rounded text-xs"
                                            >
                                                {verb}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </Card>

            <Dialog open={!!pendingEnhancement} onOpenChange={(open) => !open && setPendingEnhancement(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review Enhancement</DialogTitle>
                        <DialogDescription>
                            Review the AI-generated suggestion before applying it to your resume.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted p-4 rounded-md text-sm mt-2">
                        {pendingEnhancement?.text}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setPendingEnhancement(null)}>
                            Keep Original
                        </Button>
                        <Button onClick={confirmEnhancement}>
                            Replace Text
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function ExperienceStep({ onNext, onBack }: ExperienceStepProps) {
    const { state, dispatch } = useResume();
    const { experience } = state.resumeData;

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAddExperience = () => {
        const newExperience: Experience = {
            id: generateId(),
            company: '',
            role: '',
            startDate: '',
            endDate: '',
            current: false,
            responsibilities: [],
            order: experience.length,
        };
        dispatch({ type: 'ADD_EXPERIENCE', payload: newExperience });
    };

    const handleUpdateExperience = (id: string, data: Partial<Experience>) => {
        dispatch({ type: 'UPDATE_EXPERIENCE', payload: { id, data } });
    };

    const handleDeleteExperience = (id: string) => {
        dispatch({ type: 'DELETE_EXPERIENCE', payload: id });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = experience.findIndex((e) => e.id === active.id);
            const newIndex = experience.findIndex((e) => e.id === over.id);

            const reordered = arrayMove(experience, oldIndex, newIndex).map((e, index) => ({
                ...e,
                order: index,
            }));

            dispatch({ type: 'REORDER_EXPERIENCE', payload: reordered });
        }
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Work Experience</h2>
                    <p className="text-muted-foreground">
                        Add your professional experience. Use action verbs and quantify achievements when possible.
                    </p>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={experience.map((e) => e.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {experience.map((exp) => (
                                <ExperienceCard
                                    key={exp.id}
                                    experience={exp}
                                    onUpdate={(data) => handleUpdateExperience(exp.id, data)}
                                    onDelete={() => handleDeleteExperience(exp.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {experience.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground mb-4">No experience entries yet</p>
                        <Button onClick={handleAddExperience} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Experience
                        </Button>
                    </div>
                )}

                {experience.length > 0 && (
                    <Button onClick={handleAddExperience} variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Experience
                    </Button>
                )}

                <div className="flex justify-between pt-4 border-t">
                    <Button onClick={onBack} variant="outline" size="lg">
                        Back
                    </Button>
                    <Button onClick={onNext} size="lg">
                        Continue to Projects
                    </Button>
                </div>
            </div>
        </Card>
    );
}
