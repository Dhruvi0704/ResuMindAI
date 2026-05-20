import { useState } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Trash2, Github, ExternalLink, X, Wand2, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { generateId } from '@/types/resume';
import type { Project } from '@/types/resume';
import {
    validateTextRequired,
    validateUrl,
} from '@/utils/validationUtils';
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

interface ProjectsStepProps {
    onNext: () => void;
    onBack: () => void;
}

const techStackSuggestions = [
    'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Django', 'Flask',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS',
    'Azure', 'GCP', 'TailwindCSS', 'Material-UI', 'Express', 'FastAPI',
    'GraphQL', 'REST API', 'WebSocket', 'Firebase', 'Supabase'
];

function ProjectCard({ project, onUpdate, onDelete }: {
    project: Project;
    onUpdate: (data: Partial<Project>) => void;
    onDelete: () => void;
}) {
    const { dispatch } = useResume();
    const { toast } = useToast();
    const [newTech, setNewTech] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [enhancingDescription, setEnhancingDescription] = useState(false);
    const [pendingEnhancement, setPendingEnhancement] = useState<{ text: string } | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: project.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleTechInputChange = (value: string) => {
        setNewTech(value);
        if (value.trim()) {
            const suggestions = techStackSuggestions.filter(tech =>
                tech.toLowerCase().includes(value.toLowerCase()) &&
                !project.techStack.includes(tech)
            );
            setFilteredSuggestions(suggestions);
        } else {
            setFilteredSuggestions([]);
        }
    };

    const handleAddTech = (tech?: string) => {
        const techName = tech || newTech.trim();
        if (!techName || project.techStack.includes(techName)) return;

        const updatedTechStack = [...project.techStack, techName];
        handleTechChange(updatedTechStack);
        setNewTech('');
        setFilteredSuggestions([]);
    };

    const handleRemoveTech = (tech: string) => {
        const updatedTechStack = project.techStack.filter(t => t !== tech);
        handleTechChange(updatedTechStack);
    };

    const isValidUrl = (url: string) => {
        if (!url) return true;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const validateField = (field: string, value: string) => {
        let validationResult;
        const contextKey = `project.${project.id}.${field}`;

        switch (field) {
            case 'title':
                validationResult = validateTextRequired(value, 'Title', 3);
                break;
            case 'description':
                validationResult = validateTextRequired(value, 'Description', 20);
                break;
            case 'githubUrl':
                validationResult = validateUrl(value, 'GitHub URL');
                break;
            case 'liveUrl':
                validationResult = validateUrl(value, 'Live URL');
                break;
            case 'techStack':
                // Check if at least one tech exists
                if (project.techStack.length === 0) {
                    validationResult = { isValid: false, error: 'Add at least one technology' };
                } else {
                    validationResult = { isValid: true };
                }
                break;
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

    const handleInputChange = (field: keyof Project, value: string) => {
        onUpdate({ [field]: value });
        validateField(field, value);
    };

    const handleTechChange = (techStack: string[]) => {
        onUpdate({ techStack });
        validateField('techStack', ''); // Trigger tech stack validation
    };

    const handleEnhanceDescription = async (actionType: "grammar" | "professional" | "shorten" | "enhance" = "enhance") => {
        if (!project.description?.trim()) return;
        setEnhancingDescription(true);

        try {
            const response = await fetch('/api/enhanced-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalText: project.description,
                    sectionType: 'project',
                    jobRole: 'Software Engineer', // Fallback role for projects
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
            setEnhancingDescription(false);
        }
    };

    const confirmEnhancement = () => {
        if (!pendingEnhancement) return;
        onUpdate({ description: pendingEnhancement.text });
        validateField('description', pendingEnhancement.text);
        setPendingEnhancement(null);
        toast({
            title: 'Applied!',
            description: 'Your text has been updated.',
        });
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
                        <div>
                            <Label className="text-xs">Project Title *</Label>
                            <Input
                                value={project.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                onBlur={() => validateField('title', project.title)}
                                placeholder="My Awesome Project"
                                className={`mt-1 ${fieldErrors.title ? 'border-destructive' : ''}`}
                            />
                            {fieldErrors.title && (
                                <p className="text-xs text-destructive mt-1">{fieldErrors.title}</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label className="text-xs">Description *</Label>
                                <div className="flex gap-1" style={{ opacity: project.description ? 1 : 0.5, pointerEvents: project.description ? 'auto' : 'none' }}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleEnhanceDescription('grammar')}
                                        disabled={enhancingDescription}
                                        title="Fix Grammar"
                                        type="button"
                                    >
                                        {enhancingDescription ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-3 h-3 text-yellow-500" />
                                        )}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                disabled={enhancingDescription}
                                                title="Enhance Options"
                                                type="button"
                                            >
                                                {enhancingDescription ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Wand2 className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEnhanceDescription('professional')}>
                                                👔 Professional Tone
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEnhanceDescription('shorten')}>
                                                ✂️ Shorten Description
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEnhanceDescription('enhance')}>
                                                🪄 Auto-Enhance
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <Textarea
                                value={project.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                onBlur={() => validateField('description', project.description)}
                                placeholder="Brief description of what the project does and your role..."
                                className={`min-h-[80px] ${fieldErrors.description ? 'border-destructive' : ''}`}
                            />
                            {fieldErrors.description && (
                                <p className="text-xs text-destructive mt-1">{fieldErrors.description}</p>
                            )}
                        </div>

                        <div>
                            <Label className="text-xs">Tech Stack * (At least 1 required)</Label>
                            <div className="mt-2 flex flex-wrap gap-2 mb-2">
                                {project.techStack.map((tech) => (
                                    <Badge key={tech} variant="secondary" className="pl-3 pr-1 py-1">
                                        {tech}
                                        <button
                                            onClick={() => handleRemoveTech(tech)}
                                            className="ml-2 hover:bg-black/10 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="relative">
                                <Input
                                    value={newTech}
                                    onChange={(e) => handleTechInputChange(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTech();
                                        }
                                    }}
                                    placeholder="Add technology..."
                                    className="text-sm"
                                />
                                {filteredSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-32 overflow-auto">
                                        {filteredSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => handleAddTech(suggestion)}
                                                className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {fieldErrors.techStack && (
                                <p className="text-xs text-destructive mt-1">{fieldErrors.techStack}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs flex items-center gap-1">
                                    <Github className="w-3 h-3" />
                                    GitHub URL (Optional)
                                </Label>
                                <Input
                                    value={project.githubUrl || ''}
                                    onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                                    onBlur={() => validateField('githubUrl', project.githubUrl || '')}
                                    placeholder="https://github.com/username/repo"
                                    className={`mt-1 ${fieldErrors.githubUrl ? 'border-destructive' : ''}`}
                                />
                                {fieldErrors.githubUrl && (
                                    <p className="text-xs text-destructive mt-1">{fieldErrors.githubUrl}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    Live Demo URL (Optional)
                                </Label>
                                <Input
                                    value={project.liveUrl || ''}
                                    onChange={(e) => handleInputChange('liveUrl', e.target.value)}
                                    onBlur={() => validateField('liveUrl', project.liveUrl || '')}
                                    placeholder="https://myproject.com"
                                    className={`mt-1 ${fieldErrors.liveUrl ? 'border-destructive' : ''}`}
                                />
                                {fieldErrors.liveUrl && (
                                    <p className="text-xs text-destructive mt-1">{fieldErrors.liveUrl}</p>
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
                    <div className="bg-muted p-4 rounded-md text-sm mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap">
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

export default function ProjectsStep({ onNext, onBack }: ProjectsStepProps) {
    const { state, dispatch } = useResume();
    const { projects } = state.resumeData;

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAddProject = () => {
        const newProject: Project = {
            id: generateId(),
            title: '',
            description: '',
            techStack: [],
            order: projects.length,
        };
        dispatch({ type: 'ADD_PROJECT', payload: newProject });
    };

    const handleUpdateProject = (id: string, data: Partial<Project>) => {
        dispatch({ type: 'UPDATE_PROJECT', payload: { id, data } });
    };

    const handleDeleteProject = (id: string) => {
        dispatch({ type: 'DELETE_PROJECT', payload: id });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = projects.findIndex((p) => p.id === active.id);
            const newIndex = projects.findIndex((p) => p.id === over.id);

            const reordered = arrayMove(projects, oldIndex, newIndex).map((p, index) => ({
                ...p,
                order: index,
            }));

            dispatch({ type: 'REORDER_PROJECTS', payload: reordered });
        }
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Projects</h2>
                    <p className="text-muted-foreground">
                        Showcase your best projects. Include links to GitHub repositories and live demos.
                    </p>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={projects.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {projects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onUpdate={(data) => handleUpdateProject(project.id, data)}
                                    onDelete={() => handleDeleteProject(project.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {projects.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground mb-4">No projects yet</p>
                        <Button onClick={handleAddProject} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Project
                        </Button>
                    </div>
                )}

                {projects.length > 0 && (
                    <Button onClick={handleAddProject} variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Project
                    </Button>
                )}

                <div className="flex justify-between pt-4 border-t">
                    <Button onClick={onBack} variant="outline" size="lg">
                        Back
                    </Button>
                    <Button onClick={onNext} size="lg">
                        Continue to Certifications
                    </Button>
                </div>
            </div>
        </Card>
    );
}
