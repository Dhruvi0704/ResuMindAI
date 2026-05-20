import { useState } from "react";
import { CVFormData, CVExperience, CVProject } from "@/types/cv";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wand2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StructuredCVFormProps {
  data: CVFormData;
  onChange: (data: CVFormData) => void;
}

export default function StructuredCVForm({ data, onChange }: StructuredCVFormProps) {
  const { toast } = useToast();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isRewritingExp, setIsRewritingExp] = useState<string | null>(null);
  const [isEnhancingProject, setIsEnhancingProject] = useState<string | null>(null);
  const [isCategorizingSkills, setIsCategorizingSkills] = useState(false);

  const updateField = (field: keyof CVFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleGenerateSummary = async () => {
    if (!data.jobTitle) {
      toast({ title: "Job Title Required", description: "Please enter a job title first.", variant: "destructive" });
      return;
    }
    setIsGeneratingSummary(true);
    try {
      const res = await apiRequest("POST", "/api/cv/generate-summary", {
        cvData: data
      });
      const result = await res.json();
      updateField("summary", result.summary);
      toast({ title: "Summary Generated!" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate summary.", variant: "destructive" });
    }
    setIsGeneratingSummary(false);
  };

  const handleRewriteExperience = async (id: string, description: string) => {
    if (!description) return;
    setIsRewritingExp(id);
    try {
      const exp = data.experiences.find(e => e.id === id);
      const res = await apiRequest("POST", "/api/cv/rewrite-experience", {
        role: exp?.title || data.jobTitle || "Professional",
        company: exp?.company || "Company",
        description: description
      });
      const result = await res.json();
      const newExps = data.experiences.map((e) => 
        e.id === id ? { ...e, description: result.rewritten } : e
      );
      updateField("experiences", newExps);
      // For backward compatibility
      if (newExps[0]?.id === id) updateField("experience1Desc", result.enhancedText);
      if (newExps[1]?.id === id) updateField("experience2Desc", result.enhancedText);
      toast({ title: "Experience Rewritten!" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to rewrite experience.", variant: "destructive" });
    }
    setIsRewritingExp(null);
  };

  const handleCategorizeSkills = async () => {
    if (!data.skills) {
      toast({ title: "Skills Required", description: "Please enter some skills first.", variant: "destructive" });
      return;
    }
    setIsCategorizingSkills(true);
    try {
      const res = await apiRequest("POST", "/api/cv/categorize-skills", {
        skills: data.skills
      });
      const result = await res.json();
      updateField("structuredSkills", result.categorized);
      toast({ title: "Skills Categorized!" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to categorize skills.", variant: "destructive" });
    }
    setIsCategorizingSkills(false);
  };

  const handleEnhanceProject = async (id: string, desc: string, impact: string) => {
    if (!desc) return;
    setIsEnhancingProject(id);
    try {
      const res = await apiRequest("POST", "/api/cv/rewrite-project", {
        description: desc,
        impact: impact
      });
      const result = await res.json();
      const newProjs = data.projects.map(p => 
        p.id === id ? { ...p, impact: result.impact } : p
      );
      updateField("projects", newProjs);
      toast({ title: "Project Impact Enhanced!" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to enhance project.", variant: "destructive" });
    }
    setIsEnhancingProject(null);
  };

  const addExperience = () => {
    const newExp: CVExperience = {
      id: Date.now().toString(),
      title: "", company: "", period: "", description: ""
    };
    updateField("experiences", [...data.experiences, newExp]);
  };

  const addProject = () => {
    const newProj: CVProject = {
      id: Date.now().toString(),
      name: "", tech: "", description: "", impact: ""
    };
    updateField("projects", [...data.projects, newProj]);
  };

  const updateExperience = (id: string, field: keyof CVExperience, value: string) => {
    const newExps = data.experiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp);
    updateField("experiences", newExps);
    // Backward compatibility updates
    if (newExps[0] && newExps[0].id === id) {
      if (field === 'title') updateField("experience1Title", value);
      if (field === 'company') updateField("experience1Company", value);
      if (field === 'period') updateField("experience1Period", value);
      if (field === 'description') updateField("experience1Desc", value);
    }
    if (newExps[1] && newExps[1].id === id) {
      if (field === 'title') updateField("experience2Title", value);
      if (field === 'company') updateField("experience2Company", value);
      if (field === 'period') updateField("experience2Period", value);
      if (field === 'description') updateField("experience2Desc", value);
    }
  };

  const updateProject = (id: string, field: keyof CVProject, value: string) => {
    updateField("projects", data.projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeExperience = (id: string) => {
    updateField("experiences", data.experiences.filter(exp => exp.id !== id));
  };

  const removeProject = (id: string) => {
    updateField("projects", data.projects.filter(p => p.id !== id));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-20">
      <Accordion type="single" defaultValue="personal" collapsible className="w-full">
        <AccordionItem value="personal">
          <AccordionTrigger className="text-lg font-semibold">Personal Information</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={data.name} onChange={e => updateField("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Professional Title</Label>
                <Input value={data.jobTitle} onChange={e => updateField("jobTitle", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={data.email} onChange={e => updateField("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={data.phone} onChange={e => updateField("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={data.location} onChange={e => updateField("location", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input value={data.linkedin} onChange={e => updateField("linkedin", e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Portfolio / GitHub</Label>
                <Input value={data.portfolio || ""} onChange={e => updateField("portfolio", e.target.value)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="summary">
          <AccordionTrigger className="text-lg font-semibold">Professional Summary</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Summary Statement</Label>
                <Button variant="outline" size="sm" onClick={handleGenerateSummary} disabled={isGeneratingSummary}>
                  <Wand2 className="w-3 h-3 mr-2" />
                  {isGeneratingSummary ? "Generating..." : "Auto-Generate with AI"}
                </Button>
              </div>
              <Textarea 
                value={data.summary} 
                onChange={e => updateField("summary", e.target.value)}
                className="min-h-[120px]" 
                placeholder="Write your summary here or let AI generate it based on your Job Title..."
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience">
          <AccordionTrigger className="text-lg font-semibold">Experience</AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            {(data.experiences || []).map((exp: any, index: number) => (
              <div key={exp.id} className="p-4 border rounded-lg space-y-4 relative">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeExperience(exp.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
                <h4 className="font-medium">Experience #{index + 1}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input value={exp.title} onChange={e => updateExperience(exp.id, "title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input value={exp.company} onChange={e => updateExperience(exp.id, "company", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Input value={exp.period} onChange={e => updateExperience(exp.id, "period", e.target.value)} placeholder="e.g. Jan 2020 - Present" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Description / Responsibilities</Label>
                    <Button variant="outline" size="sm" onClick={() => handleRewriteExperience(exp.id, exp.description)} disabled={isRewritingExp === exp.id || !exp.description}>
                      <Wand2 className="w-3 h-3 mr-2" />
                      {isRewritingExp === exp.id ? "Rewriting..." : "Convert to Achievements"}
                    </Button>
                  </div>
                  <Textarea 
                    value={exp.description} 
                    onChange={e => updateExperience(exp.id, "description", e.target.value)}
                    className="min-h-[100px]" 
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={addExperience}>
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="education">
          <AccordionTrigger className="text-lg font-semibold">Education</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Degree / Study Data</Label>
                <Input value={data.education} onChange={e => updateField("education", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>School / University</Label>
                <Input value={data.educationSchool} onChange={e => updateField("educationSchool", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Graduation Year</Label>
                <Input value={data.educationYear} onChange={e => updateField("educationYear", e.target.value)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="skills">
          <AccordionTrigger className="text-lg font-semibold">Skills</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>All Skills (Comma separated)</Label>
                <Button variant="outline" size="sm" onClick={handleCategorizeSkills} disabled={isCategorizingSkills || !data.skills}>
                  <Wand2 className="w-3 h-3 mr-2" />
                  {isCategorizingSkills ? "Categorizing..." : "Categorize with AI"}
                </Button>
              </div>
              <Textarea 
                value={data.skills} 
                onChange={e => updateField("skills", e.target.value)}
                placeholder="React, Node.js, Python, Leadership, etc." 
              />
            </div>
            
            {data.structuredSkills && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Technical</Label>
                  <div className="text-sm">{(data.structuredSkills.technical || []).join(", ") || "None"}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Frameworks</Label>
                  <div className="text-sm">{data.structuredSkills.frameworks?.join(", ") || "None"}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Soft Skills</Label>
                  <div className="text-sm">{data.structuredSkills.softSkills?.join(", ") || "None"}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Languages</Label>
                  <div className="text-sm">{data.structuredSkills.languages?.join(", ") || "None"}</div>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="projects">
          <AccordionTrigger className="text-lg font-semibold">Projects</AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            {(data.projects || []).map((proj: any, index: number) => (
              <div key={proj.id} className="p-4 border rounded-lg space-y-4 relative">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeProject(proj.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
                <h4 className="font-medium">Project #{index + 1}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input value={proj.name} onChange={e => updateProject(proj.id, "name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tech Stack</Label>
                    <Input value={proj.tech} onChange={e => updateProject(proj.id, "tech", e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Description</Label>
                    <Textarea value={proj.description} onChange={e => updateProject(proj.id, "description", e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <div className="flex justify-between items-center">
                      <Label>Impact / Results</Label>
                      <Button variant="outline" size="sm" onClick={() => handleEnhanceProject(proj.id, proj.description, proj.impact)} disabled={isEnhancingProject === proj.id || !proj.description}>
                        <Wand2 className="w-3 h-3 mr-2" />
                        {isEnhancingProject === proj.id ? "Enhancing..." : "Add Impact Metrics"}
                      </Button>
                    </div>
                    <Textarea value={proj.impact} onChange={e => updateProject(proj.id, "impact", e.target.value)} placeholder="e.g. Increased speed by 40%..." />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={addProject}>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
