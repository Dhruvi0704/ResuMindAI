import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePlus, Upload, FileText, Wand2, Download, Save, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { JOB_ROLES, CATEGORIES } from "@/lib/jobRoles";
import FileUpload from "@/components/FileUpload";
import CVDashboard from "@/components/CVDashboard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { ResumeProvider, useResume } from "@/contexts/ResumeContext";

// ENGINE IMPORTS
import { BlueprintType } from "@/types/template";
import { prebuiltThemes } from "@/components/resume/engine/themes";
import TemplateComposer from "@/components/resume/engine/TemplateComposer";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSectionItem } from "@/components/resume/engine/SortableSectionItem";

// SIDEBAR ICON HELPER
const LayoutIcon = ({ type }: { type: BlueprintType }) => {
  switch (type) {
    case "SingleColumn":
    case "AcademicFormal":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 opacity-70" fill="currentColor">
          <rect x="4" y="3" width="16" height="4" rx="1" />
          <rect x="4" y="9" width="16" height="12" rx="1" />
        </svg>
      );
    case "ClassicTwoColumn":
    case "TimelineLeft":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 opacity-70" fill="currentColor">
          <rect x="3" y="3" width="6" height="18" rx="1" />
          <rect x="11" y="3" width="10" height="18" rx="1" />
        </svg>
      );
    case "ReverseTwoColumn":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 opacity-70" fill="currentColor">
          <rect x="3" y="3" width="10" height="18" rx="1" />
          <rect x="15" y="3" width="6" height="18" rx="1" />
        </svg>
      );
    case "HeaderBand":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 opacity-70" fill="currentColor">
          <rect x="2" y="2" width="20" height="6" rx="1" />
          <rect x="4" y="10" width="16" height="12" rx="1" />
        </svg>
      );
    case "ModernSplit":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 opacity-70" fill="currentColor">
          <path d="M2 2 H22 V10 L2 6 Z" />
          <rect x="4" y="12" width="16" height="10" rx="1" />
        </svg>
      );
    case "MinimalTop":
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 opacity-70" fill="currentColor">
          <rect x="8" y="4" width="8" height="2" rx="0.5" />
          <rect x="6" y="8" width="12" height="12" rx="1" />
        </svg>
      );
    default:
      return <svg viewBox="0 0 24 24" className="w-8 h-8 opacity-70" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="1" /></svg>;
  }
};

const BLUEPRINTS: BlueprintType[] = [
  "SingleColumn", "ClassicTwoColumn", "ReverseTwoColumn", 
  "HeaderBand", "TimelineLeft", "ModernSplit", 
  "MinimalTop", "AcademicFormal"
];

export interface SectionConfig {
  id: string;
  visible: boolean;
  locked: boolean;
  order: number;
  variant: string;
  variantOptions: string[];
}

const INITIAL_SECTION_CONFIG: SectionConfig[] = [
  { id: 'header',       visible: true,  locked: true,  order: 0,
    variant: 'centered',
    variantOptions: ['centered', 'left', 'withPhoto', 'banner'] },
  { id: 'summary',      visible: true,  locked: false, order: 1,
    variant: 'default',
    variantOptions: ['default', 'compact', 'detailed'] },
  { id: 'experience',   visible: true,  locked: false, order: 2,
    variant: 'default',
    variantOptions: ['default', 'timeline', 'cards', 'compact'] },
  { id: 'education',    visible: true,  locked: false, order: 3,
    variant: 'default',
    variantOptions: ['default', 'compact', 'detailed'] },
  { id: 'skills',       visible: true,  locked: false, order: 4,
    variant: 'tags',
    variantOptions: ['tags', 'bars', 'pills', 'dots'] },
  { id: 'publications', visible: false, locked: false, order: 5,
    variant: 'numbered',
    variantOptions: ['numbered', 'compact', 'detailed'] },
  { id: 'projects',     visible: false, locked: false, order: 6,
    variant: 'cards',
    variantOptions: ['cards', 'compact', 'list'] },
  { id: 'certifications',visible: false,locked: false, order: 7,
    variant: 'default',
    variantOptions: ['default', 'compact', 'badges'] },
  { id: 'awards',       visible: false, locked: false, order: 8,
    variant: 'default',
    variantOptions: ['default', 'compact'] },
  { id: 'languages',    visible: false, locked: false, order: 9,
    variant: 'bars',
    variantOptions: ['bars', 'pills', 'flags'] },
  { id: 'research',     visible: false, locked: false, order: 10,
    variant: 'default',
    variantOptions: ['default', 'detailed', 'compact'] },
  { id: 'grants',       visible: false, locked: false, order: 11,
    variant: 'default',
    variantOptions: ['default', 'compact'] },
  { id: 'conferences',  visible: false, locked: false, order: 12,
    variant: 'default',
    variantOptions: ['default', 'compact'] },
  { id: 'references',   visible: false, locked: false, order: 13,
    variant: 'default',
    variantOptions: ['default', 'hidden'] },
];

const MOCK_CV_DATA = {
  name: "Dr. Sarah Chen",
  jobTitle: "Principal AI Research Scientist",
  email: "sarah.chen@example.com",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  summary: "Award-winning AI researcher with 8+ years of experience specializing in Large Language Models and Reinforcement Learning. Proven track record of publishing in top-tier conferences (NeurIPS, ICML) and leading cross-functional teams to deliver scalable AI solutions.",
  experiences: [
    {
      title: "Senior Research Scientist",
      company: "DeepMind AI Labs",
      period: "2020 - Present",
      description: "Led the development of a novel RLHF framework for language models, improving helpfulness by 34%. Managed a team of 4 researchers and 2 engineers."
    },
    {
      title: "Machine Learning Engineer",
      company: "Tech Giant Solutions",
      period: "2017 - 2020",
      description: "Implemented highly scalable recommendation systems serving 50M+ daily active users. Reduced model latency by 45% through model quantization techniques."
    }
  ],
  education: "Ph.D. in Computer Science",
  educationSchool: "Stanford University",
  educationYear: "2017",
  skills: "Python • PyTorch • TensorFlow • Large Language Models • Reinforcement Learning • C++ • Distributed Training • Git • JAX"
};

export default function CVGenerator() {
  const [activeTab, setActiveTab] = useState("create");
  const [uploadedCV, setUploadedCV] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [openTargetRole, setOpenTargetRole] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  // ENGINE STATE
  const [activeBlueprint, setActiveBlueprint] = useState<BlueprintType>("ModernSplit");
  const [activeThemeId, setActiveThemeId] = useState<string>("midnight-pro");
  const [sectionConfig, setSectionConfig] = useState<SectionConfig[]>(INITIAL_SECTION_CONFIG);
  const [currentResume, setCurrentResume] = useState<any>(MOCK_CV_DATA); // Use Real CV Data eventually

  const { user: currentUser } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [currentCvId, setCurrentCvId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [originalScore, setOriginalScore] = useState<number | null>(null);
  const [improvedCV, setImprovedCV] = useState<any>(null);
  const [wasImproved, setWasImproved] = useState(false);
  const cvPreviewRef = useRef<HTMLDivElement>(null);
  const { dispatch } = useResume();

  const queryClient = useQueryClient();

  const { data: resumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/resumes");
      return res.json();
    }
  });

  // Handle URL query params targeting specific CV
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resumeId = params.get("id");

    if (resumeId && resumes) {
      const resume = resumes.find((r: any) => r.id === resumeId);
      if (resume) {
        // Here we would sync the resume content to currentResume
        if (resume.content) {
          try {
             setCurrentResume(JSON.parse(resume.content));
          } catch(e) {}
        }
      }
    }
  }, [resumes]);

  // Engine DndKit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionConfig((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Ensure header stays at top if necessary, although ordering naturally handles it
        // Or simply assign new .order properties based on array index
        const newlyOrdered = newItems.map((item, index) => ({
          ...item,
          order: index
        }));
        
        console.log('🔄 Reordered sections:', newlyOrdered);
        return newlyOrdered;
      });
    }
  };

  const handleVisibilityChange = (sectionId: string, visible: boolean) => {
    setSectionConfig((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, visible } : s))
    );
  };

  const handleVariantChange = (sectionId: string, newVariant: string) => {
    setSectionConfig((prev) => {
      const updatedConfig = prev.map((s) =>
        s.id === sectionId ? { ...s, variant: newVariant } : s
      );
      console.log('📋 New sectionConfig after variant change:', updatedConfig);
      return updatedConfig;
    });
  };

  // For backward compatibility while cleaning up, though we only use sectionConfig directly now
  const config = {
    blueprint: activeBlueprint,
    theme: prebuiltThemes[activeThemeId],
    sectionOrder: sectionConfig.filter(s => s.visible).map(s => s.id),
    sectionVariants: sectionConfig.reduce((acc, s) => ({ ...acc, [s.id]: s.variant }), {})
  };

  useEffect(() => {
    // Track unsaved changes on any document or template change
    setHasUnsavedChanges(true);
  }, [currentResume, sectionConfig, activeBlueprint, activeThemeId]);

  const handleSaveCV = React.useCallback(async (isAutoSave = false) => {
    if (isSavingRef.current) return;
    if (!currentUser?.id || !currentResume?.name) return;
    if (!hasUnsavedChanges) return;

    isSavingRef.current = true;
    setIsSaving(true);
    
    try {
      const payload = {
        userId: currentUser.id,
        cvId: currentCvId || undefined,
        cvName: currentResume?.name 
                ? `${currentResume.name}'s CV` 
                : 'My CV',
        cvData: currentResume,
        templateConfig: {
          blueprint: activeBlueprint,
          themeId: activeThemeId,
          sectionConfig: sectionConfig
        }
      };
      
      const res = await fetch('/api/cv/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success) {
        setCurrentCvId(data.cvId);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        if (!isAutoSave) {
          toast({ 
            title: "CV saved successfully",
            description: "Your progress has been saved"
          });
        }
      } else {
        throw new Error(data.message || "Save returned unsuccessful");
      }
    } catch (error) {
      console.error('Save failed:', error);
      setHasUnsavedChanges(false);
      if (!isAutoSave) {
        toast({ 
          title: "Save failed", 
          description: "Please try again",
          variant: "destructive" 
        });
      } else {
        console.warn('Auto-save failed silently:', error);
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [currentUser, currentResume, hasUnsavedChanges, currentCvId, activeBlueprint, activeThemeId, sectionConfig, toast]);

  const handleSaveCVRef = useRef(handleSaveCV);
  useEffect(() => {
    handleSaveCVRef.current = handleSaveCV;
  }, [handleSaveCV]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!currentUser?.id) return;
      if (!currentResume?.name) return;
      if (!hasUnsavedChanges) return;
      if (isSavingRef.current) return;
      
      await handleSaveCVRef.current(true);
    }, 30000);

    const startDelay = setTimeout(() => {}, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(startDelay);
    };
  }, [currentUser?.id, currentResume?.name, hasUnsavedChanges]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setIsPrinting(true);
    
    // Allow React state to flush and re-render without toolbars
    await new Promise(r => setTimeout(r, 150));
    
    try {
      const element = cvPreviewRef.current;
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width at 96 DPI
        windowWidth: 794
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      let heightLeft = imgHeight * ratio;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight * ratio;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;
      }
      
      const name = currentResume?.name || 'CV';
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`${name}_CV_${date}.pdf`);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({ 
        title: "PDF generation failed", 
        description: "Please try again later.",
        variant: "destructive" 
      });
    } finally {
      setIsDownloading(false);
      setIsPrinting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        if (!base64) {
          reject(new Error('Failed to convert file to base64'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  };

  const validateFile = (file: File | null): string | null => {
    if (!file) return 'No file uploaded';
    if (file.size > 10 * 1024 * 1024) return 'File too large (max 10MB)';
    if (!['application/pdf', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
          .includes(file.type)) {
      return 'Only PDF and DOCX files supported';
    }
    return null; // valid
  };

  const handleAnalyzeCV = async () => {
    // Validate
    const validationError = validateFile(uploadedCV);
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive",
        duration: 4000
      });
      return;
    }

    if (!targetRole) {
      toast({
        title: "Select a job role",
        description: "Please select your target job role first",
        variant: "destructive",
        duration: 4000
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisData(null);

    try {
      const base64 = await fileToBase64(uploadedCV!);
      
      const res = await fetch('/api/cv/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64,
          fileType: uploadedCV!.type,
          fileName: uploadedCV!.name,
          targetRole: targetRole,
          userId: currentUser?.id
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${res.status}`);
      }

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Analysis failed');
      }

      setAnalysisData(data.analysis);
      setShowAnalysis(true);
      toast({
        title: "Analysis complete ✓",
        description: "Your CV has been analyzed",
        duration: 3000
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      let msg = error.message || "Could not analyze the document.";
      if (msg.includes('GoogleGenerativeAI') || msg.includes('404')) {
        msg = "The AI model is currently unavailable. Please verify your API key limits.";
      }
      toast({
        title: "Analysis Failed",
        description: msg,
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImproveWithAI = async () => {
    if (!uploadedCV) {
      toast({ title: "Upload a CV first", variant: "destructive", duration: 3000 });
      return;
    }

    // Capture BEFORE score immediately as local var
    const scoreBefore = analysisData?.overallScore || 0;

    setIsOptimizing(true);
    try {
      const base64 = await fileToBase64(uploadedCV);
      
      const res = await fetch('/api/cv/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64,
          fileType: uploadedCV.type,
          fileName: uploadedCV.name,
          targetRole: targetRole,
          userId: currentUser?.id,
          currentScore: analysisData?.overallScore || 0,
          currentAtsScore: analysisData?.atsScore || 0,
          currentQuality: analysisData?.skillDistribution?.content || 50,
          currentEduScore: analysisData?.skillDistribution?.education || 70,
          currentYearsExp: analysisData?.cvInfo?.yearsExperience || 0,
          currentSections: analysisData?.sections || {}
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Improvement failed');
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Improvement failed');
      }

      const scoreAfter = data.newAnalysis?.overallScore || scoreBefore;

      setOriginalScore(scoreBefore);
      setAnalysisData(data.newAnalysis);
      setCurrentResume(data.improvedCV);
      setImprovedCV(data.improvedCV);
      setWasImproved(true);
      
      if (data.improvedCV) {
        dispatch({
          type: 'LOAD_CV',
          payload: data.improvedCV
        });
      }

      setShowAnalysis(true);
      
      setTimeout(() => {
        setActiveTab("editor");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const scoreDiff = scoreAfter - scoreBefore;
        toast({
          title: scoreDiff > 0 
            ? `✅ CV Improved! +${scoreDiff} pts`
            : '✅ CV Improved!',
          description: `Score: ${scoreBefore} → ${scoreAfter}. Your CV is now loaded in the Editor. Click any field to edit!`,
          duration: 5000
        });
      }, 150);

    } catch (error: any) {
      let msg = error.message || "Could not optimize the document.";
      if (msg.includes('GoogleGenerativeAI') || msg.includes('404')) {
        msg = "The AI model is currently unavailable. Please verify your API key limits.";
      }
      toast({
        title: "Optimization Failed",
        description: msg,
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDownloadImprovedCV = async () => {
    if (!improvedCV) return;
    
    // Import jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    let y = 20;
    const lineHeight = 7;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    
    // Name (from original CV or improved)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(
      improvedCV.name || 'Improved CV', 
      pageWidth / 2, y, { align: 'center' }
    );
    y += 10;
    
    // Role
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 99, 255);
    doc.text(
      targetRole, 
      pageWidth / 2, y, { align: 'center' }
    );
    y += 15;
    doc.setTextColor(0, 0, 0);
    
    // Summary
    if (improvedCV.summary) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFESSIONAL SUMMARY', margin, y);
      y += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(
        improvedCV.summary, pageWidth - margin * 2
      );
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * lineHeight + 8;
    }
    
    // Experience
    if (improvedCV.experience?.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('EXPERIENCE', margin, y);
      y += lineHeight;
      
      improvedCV.experience.forEach((exp: any) => {
        if (y > 270) { doc.addPage(); y = 20; }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(exp.role || '', margin, y);
        doc.text(
          `${exp.startDate} - ${exp.endDate}`,
          pageWidth - margin, y, { align: 'right' }
        );
        y += lineHeight - 2;
        
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(108, 99, 255);
        doc.text(exp.company || '', margin, y);
        doc.setTextColor(0, 0, 0);
        y += lineHeight;
        
        doc.setFont('helvetica', 'normal');
        exp.bullets?.forEach((bullet: string) => {
          if (y > 270) { doc.addPage(); y = 20; }
          const bulletLines = doc.splitTextToSize(
            `• ${bullet}`, pageWidth - margin * 2 - 5
          );
          doc.text(bulletLines, margin + 3, y);
          y += bulletLines.length * (lineHeight - 1);
        });
        y += 6;
      });
    }
    
    // Skills
    if (improvedCV.skills?.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SKILLS', margin, y);
      y += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const skillsText = improvedCV.skills.join(' • ');
      const skillLines = doc.splitTextToSize(
        skillsText, pageWidth - margin * 2
      );
      doc.text(skillLines, margin, y);
    }
    
    // Save PDF
    const fileName = `Improved_CV_${targetRole.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 overflow-hidden">
      <style>{`
        .print-mode .edit-overlay { display: none !important; }
        .print-mode [data-edit-button] { display: none !important; }
        .print-mode [data-sortable-handle] { display: none !important; }
        .print-mode [data-delete-button] { display: none !important; }
        /* Add additional selectors to hide interactive UI during print */
        .print-mode button { display: none !important; }
        .print-mode:hover::before { display: none !important; }
      `}</style>
      
      <main className="flex-grow flex flex-col">
        {/* Top Header & Tabs (Always Visible) */}
        <div className="w-full border-b bg-background z-20 px-8 py-4">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Resume Engine</h1>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" data-testid="tab-create-cv">
                  <FilePlus className="w-4 h-4 mr-2" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="improve" data-testid="tab-improve-cv">
                  <Wand2 className="w-4 h-4 mr-2" />
                  AI Improve
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Dynamic Content Area */}
        {activeTab === "create" ? (
          <div className="flex flex-1 h-[calc(100vh-130px)] bg-slate-100 dark:bg-slate-900">
            {/* LEFT PANEL: 320px fixed */}
            <div 
              className="w-[320px] shrink-0 overflow-y-auto shadow-xl z-10" 
              style={{ 
                backgroundColor: "#1a1a2e", 
                color: "white",
                scrollbarWidth: "thin",
                scrollbarColor: "#6C63FF transparent"
              }}
            >
              <div className="p-5 pb-2 sticky top-0 bg-[#1a1a2e] z-20 border-b border-white/10">
                <h2 className="text-lg font-bold text-white opacity-90 mb-1">Engine Controls</h2>
                <p className="text-[11px] text-slate-400">Live Architecture Composer</p>
              </div>
              
              <div className="p-4 flex flex-col gap-6">
                {/* LAYER 1 */}
                <div>
                  <h3 
                    className="uppercase tracking-widest font-semibold mb-3"
                    style={{ fontSize: '11px', color: '#6C63FF', padding: '12px 8px 4px' }}
                  >
                    1. SELECT LAYOUT (LAYER 1)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {BLUEPRINTS.map(bp => (
                      <div 
                        key={bp} 
                        onClick={() => setActiveBlueprint(bp)}
                        className={`relative cursor-pointer rounded p-2 border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          activeBlueprint === bp 
                            ? "border-[#6C63FF] bg-[#6C63FF]/10 text-white" 
                            : "border-slate-700/50 bg-white/5 text-slate-300 hover:border-slate-500 hover:bg-white/10"
                        }`}
                      >
                        <LayoutIcon type={bp} />
                        <span className="text-[9px] text-center font-medium leading-tight mt-1">
                          {bp.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LAYER 2: SECTIONS */}
                <div>
                  <h3 
                    className="uppercase tracking-widest font-semibold mb-3"
                    style={{ fontSize: '11px', color: '#6C63FF', padding: '12px 8px 4px' }}
                  >
                    2. SELECT SECTIONS (LAYER 2)
                  </h3>
                  <div className="flex flex-col gap-2">
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={sectionConfig.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {[...sectionConfig].sort((a,b) => a.order - b.order).map(section => (
                          <SortableSectionItem 
                            key={section.id} 
                            section={section} 
                            onVisibilityChange={handleVisibilityChange}
                            onVariantChange={handleVariantChange}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>

                {/* LAYER 3: THEMES */}
                <div className="pb-8">
                  <h3 
                    className="uppercase tracking-widest font-semibold mb-3"
                    style={{ fontSize: '11px', color: '#6C63FF', padding: '12px 8px 4px' }}
                  >
                    3. SELECT THEME (LAYER 3)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(prebuiltThemes).map(theme => (
                      <div 
                        key={theme.id} 
                        onClick={() => setActiveThemeId(theme.id)}
                        className={`relative cursor-pointer rounded p-2 border-2 transition-all flex flex-col items-start gap-1 ${
                          activeThemeId === theme.id 
                            ? "border-[#6C63FF] bg-[#6C63FF]/10 text-white" 
                            : "border-slate-700/50 bg-white/5 text-slate-300 hover:border-slate-500 hover:bg-white/10"
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm flex-shrink-0" 
                          style={{ 
                            background: `linear-gradient(135deg, ${theme.backgroundColor} 50%, ${theme.accentColor} 50%)`,
                            border: `1px solid ${theme.textPrimary}20`
                          }} 
                        />
                        <span className="text-[9px] font-medium leading-tight truncate w-full mt-1">
                          {theme.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: LIVE PREVIEW */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-100/50 dark:bg-[#0f0f1a]">
              {/* Toolbar */}
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
                <div className="flex gap-3 pointer-events-auto">
                  <div 
                    className="flex items-center gap-2 font-medium text-xs px-3 py-1.5 rounded-md shadow-sm pointer-events-auto backdrop-blur-md"
                    style={{ backgroundColor: "#1a1a2e", border: "1px solid #6C63FF", color: "white" }}
                  >
                    <span className="opacity-70">Blueprint:</span> 
                    <span>{activeBlueprint.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                  <div 
                    className="flex items-center gap-2 font-medium text-xs px-3 py-1.5 rounded-md shadow-sm pointer-events-auto backdrop-blur-md"
                    style={{ backgroundColor: "#1a1a2e", border: "1px solid #6C63FF", color: "white" }}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: prebuiltThemes[activeThemeId].accentColor }} 
                    />
                    <span>{prebuiltThemes[activeThemeId].name}</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Canvas Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pt-20 pb-20 px-4 flex justify-center">
                <div className="transform-gpu origin-top transition-transform h-max pb-32 w-full max-w-[850px]">
                  {wasImproved && (
                    <div style={{
                      background: 'rgba(6,214,160,0.1)',
                      border: '1px solid rgba(6,214,160,0.3)',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px'
                    }}>
                      <span style={{ color: '#06D6A0', fontWeight: 500 }}>
                        ✨ AI-improved CV loaded — click any field to edit.
                      </span>
                      <button onClick={handleDownloadImprovedCV} style={{
                        background: '#6C63FF', color: 'white', border: 'none',
                        borderRadius: '6px', padding: '6px 14px', fontSize: '12px',
                        cursor: 'pointer', fontWeight: 500
                      }}>
                        Download Original Format
                      </button>
                    </div>
                  )}
                  <Card className="shadow-2xl overflow-hidden bg-white border border-slate-200/50 min-h-[1100px]">
                     {/* The Template Composer uses 100% width, scaling to whatever its parent is. A4 ratio roughly maintained inside. */}
                    <div ref={cvPreviewRef} id="cv-preview-container" className={isPrinting ? 'print-mode' : ''}>
                      <TemplateComposer config={config} sectionConfig={sectionConfig} cvData={currentResume} />
                    </div>
                  </Card>
                </div>
              </div>
              
              {/* Bottom Action Bar */}
              <div style={{
                position: 'sticky',
                bottom: 0,
                background: '#0f0f1a',
                borderTop: '1px solid rgba(108,99,255,0.2)',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10,
              }}>
                <div>
                  <span className="text-sm flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                    {hasUnsavedChanges ? (
                      <><span className="w-2 h-2 rounded-full bg-amber-500"></span> Unsaved changes</>
                    ) : lastSaved ? (
                      <><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Saved {formatDistanceToNow(lastSaved)} ago</>
                    ) : (
                      <><span className="w-2 h-2 rounded-full bg-slate-500"></span> Not saved yet</>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleSaveCV(false)} 
                    disabled={isSaving}
                    className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
                  >
                    {isSaving ? (
                      <><Loader2 className="animate-spin w-4 h-4 mr-2" />Saving...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Save CV</>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleDownloadPDF} 
                    disabled={isDownloading}
                    style={{ backgroundColor: '#6C63FF', color: 'white' }}
                    className="hover:bg-[#5a52d5] shadow-sm"
                  >
                    {isDownloading ? (
                      <><Loader2 className="animate-spin w-4 h-4 mr-2" />Generating PDF...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2" />Download PDF</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Upload Your CV</h2>
                    <FileUpload onFileSelect={setUploadedCV} accept=".pdf,.docx" maxSize={10} />
                  </Card>

                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Target Job Role</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select the role you're aiming for to get tailored suggestions.
                    </p>
                    <Popover open={openTargetRole} onOpenChange={setOpenTargetRole}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={openTargetRole}
                          className="w-full justify-between h-10 bg-[#1a1a2e] border-[#6C63FF40] text-white hover:bg-[#1a1a2e]/90 hover:text-white">
                          <span className="truncate flex items-center gap-2">
                            {targetRole && JOB_ROLES.find(j => j.label === targetRole) === undefined && <span className="text-[#6C63FF]">✏</span>}
                            {targetRole || "Search or select job role..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[calc(100vw-48px)] sm:w-[500px] p-0 bg-[#1a1a2e] border-[#6C63FF40]" sideOffset={4}>
                        <Command className="bg-transparent text-white" filter={(value, search) => {
                           if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                           return 0;
                        }}>
                          <CommandInput 
                            placeholder="Type any job role..." 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="text-white border-b border-[#6C63FF40]"
                          />
                          <CommandEmpty className="p-2 text-sm text-center">
                            {searchQuery && (
                              <button className="w-full p-2 text-left hover:bg-[#6C63FF20] rounded-sm text-white transition-colors"
                                onClick={() => {
                                  setTargetRole(searchQuery);
                                  setOpenTargetRole(false);
                                }}>
                                Use "{searchQuery}" as custom role ↵
                              </button>
                            )}
                          </CommandEmpty>
                          <CommandList className="max-h-[320px] overflow-y-auto custom-scrollbar">
                            {CATEGORIES.map(category => {
                              const filtered = JOB_ROLES.filter(job =>
                                job.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                job.category.toLowerCase().includes(searchQuery.toLowerCase())
                              ).filter(j => j.category === category);
                              
                              if (filtered.length === 0) return null;

                              return (
                                <CommandGroup key={category} heading={<span className="text-[#6C63FF] text-[11px] uppercase tracking-[0.08em] font-semibold">{category}</span>}>
                                  {filtered.map(job => (
                                      <CommandItem
                                        key={job.value}
                                        value={job.label}
                                        onSelect={() => {
                                          setTargetRole(job.label);
                                          setOpenTargetRole(false);
                                        }}
                                        className="text-white hover:bg-[#6C63FF20] aria-selected:bg-[#6C63FF20] aria-selected:text-white"
                                      >
                                        <Check className={cn("mr-2 h-4 w-4 text-[#6C63FF]",
                                          targetRole === job.label ? "opacity-100" : "opacity-0"
                                        )} />
                                        {job.label}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              )
                            })}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </Card>

                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Analysis & Optimization</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose to deeply analyze your current resume, or let AI instantly rewrite it into a highly optimized format.
                    </p>
                    <div className="flex flex-col gap-3">
                      <Button onClick={handleAnalyzeCV} disabled={isAnalyzing || isOptimizing} data-testid="button-analyze-cv" variant="outline">
                        {isAnalyzing ? "Analyzing CV..." : "Analyze CV"}
                      </Button>
                      <Button onClick={handleImproveWithAI} disabled={isAnalyzing || isOptimizing} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
                        <Wand2 className="w-4 h-4 mr-2" />
                        {isOptimizing ? "Rewriting with AI..." : "Improve My CV with AI"}
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-2 xl:col-span-1">
                  {showAnalysis && analysisData ? (
                    <div className="flex flex-col gap-4">
                      {originalScore && analysisData && (
                        <div style={{
                          background: 'rgba(108,99,255,0.1)',
                          border: '1px solid rgba(108,99,255,0.3)',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Before</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>
                              {originalScore}
                            </p>
                          </div>
                          
                          <div style={{ fontSize: '24px', color: '#6C63FF' }}>→</div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>After AI Improve</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#06D6A0' }}>
                              {analysisData.overallScore}
                            </p>
                          </div>
                          
                          <div style={{ 
                            background: (analysisData.overallScore - originalScore) >= 0 ? '#06D6A0' : '#EF4444',
                            color: '#000',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 700
                          }}>
                            {(analysisData.overallScore - originalScore) >= 0 
                              ? `+${analysisData.overallScore - originalScore} pts`
                              : `${analysisData.overallScore - originalScore} pts`
                            }
                          </div>
                        </div>
                      )}
                      
                      

                      <CVDashboard analysisData={analysisData} targetRole={targetRole} />
                    </div>
                  ) : (
                    <Card className="p-12 h-full flex flex-col items-center justify-center border-dashed">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Ready for checking</h3>
                      <p className="text-muted-foreground text-center max-w-sm">
                        Upload your CV PDF or DOCX and click "Analyze CV" to see a comprehensive dashboard with strengths, weaknesses, and a structured keyword gap analysis.
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
