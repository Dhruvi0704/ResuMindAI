import React, { useState } from "react";
import { BlueprintType } from "@/types/template";
import { prebuiltThemes } from "./themes";
import TemplateComposer from "./TemplateComposer";
import { Card } from "@/components/ui/card";
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
import { SortableSectionItem } from "./SortableSectionItem";

const LayoutIcon = ({ type }: { type: BlueprintType }) => {
  // Simple wireframe SVGs for layouts
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

const MOCK_CV_DATA = {
  name: "Dr. Sarah Chen",
  jobTitle: "Principal AI Research Scientist",
  email: "sarah.chen@example.com",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  summary: "Award-winning AI researcher with 8+ years of experience specializing in Large Language Models and Reinforcement Learning. Proven track record of publishing in top-tier conferences (NeurIPS, ICML) and leading cross-functional teams to deliver scalable AI solutions. Passionate about ethical AI and model alignment.",
  experiences: [
    {
      title: "Senior Research Scientist",
      company: "DeepMind AI Labs",
      period: "2020 - Present",
      description: "Led the development of a novel RLHF framework for language models, improving helpfulness by 34%. Managed a team of 4 researchers and 2 engineers. Published 3 papers in Tier-1 conferences."
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

const BLUEPRINTS: BlueprintType[] = [
  "SingleColumn", "ClassicTwoColumn", "ReverseTwoColumn", 
  "HeaderBand", "TimelineLeft", "ModernSplit", 
  "MinimalTop", "AcademicFormal"
];

const INITIAL_SECTIONS: any[] = [
  { id: "header", name: "Header", visible: true, variant: "centered", locked: true },
  { id: "summary", name: "Summary", visible: true, variant: "default" },
  { id: "experience", name: "Experience", visible: true, variant: "timeline" },
  { id: "education", name: "Education", visible: true, variant: "default" },
  { id: "skills", name: "Skills", visible: true, variant: "bars" },
  { id: "publications", name: "Publications", visible: false, variant: "default" },
  { id: "research", name: "Research", visible: false, variant: "default" },
  { id: "projects", name: "Projects", visible: false, variant: "default" },
  { id: "certifications", name: "Certifications", visible: false, variant: "default" },
  { id: "awards", name: "Awards", visible: false, variant: "default" },
  { id: "languages", name: "Languages", visible: false, variant: "default" },
  { id: "grants", name: "Grants", visible: false, variant: "default" },
  { id: "conferences", name: "Conferences", visible: false, variant: "default" },
  { id: "references", name: "References", visible: false, variant: "default" },
];

export default function EngineTestRunner() {
  const [activeBlueprint, setActiveBlueprint] = useState<BlueprintType>("ModernSplit");
  const [activeThemeId, setActiveThemeId] = useState<string>("midnight-pro");
  const [sections, setSections] = useState(INITIAL_SECTIONS);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        
        // Prevent reordering above header, but gracefully handle it by forcing header to top anyway
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Ensure header is ALWAYS first
        const headerIdx = newItems.findIndex(i => i.id === 'header');
        if (headerIdx > 0) {
           const headerItem = newItems.splice(headerIdx, 1)[0];
           newItems.unshift(headerItem);
        }
        return newItems;
      });
    }
  };

  const toggleSection = (id: string, visible: boolean) => {
    setSections(items => items.map(item => item.id === id ? { ...item, visible } : item));
  };

  const changeVariant = (id: string, variant: string) => {
    setSections(items => items.map(item => item.id === id ? { ...item, variant } : item));
  };

  // Convert array to the config format Layer 4 expects
  const config = {
    blueprint: activeBlueprint,
    theme: prebuiltThemes[activeThemeId],
    sectionOrder: sections.filter(s => s.visible).map(s => s.id),
    sectionVariants: sections.reduce((acc, s) => ({ ...acc, [s.id]: s.variant }), {})
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      {/* SIDEBAR CONTROLS */}
      <div 
        className="w-[340px] shrink-0 overflow-y-auto shadow-xl z-10" 
        style={{ 
          backgroundColor: "#1a1a2e", 
          color: "white",
          scrollbarWidth: "thin",
          scrollbarColor: "#6C63FF transparent"
        }}
      >
        <div className="p-6 pb-2 sticky top-0 bg-[#1a1a2e] z-20 border-b border-white/10">
          <h2 className="text-xl font-bold text-white opacity-90 mb-1">Engine Controls</h2>
          <p className="text-xs text-slate-400">Live Architecture Composer</p>
        </div>
        
        <div className="p-4 flex flex-col gap-6">
          {/* LAYER 1 */}
          <div>
            <h3 
              className="uppercase tracking-widest font-semibold mb-3"
              style={{ fontSize: '11px', color: '#6C63FF', padding: '16px 12px 8px' }}
            >
              1. SELECT LAYOUT (LAYER 1)
            </h3>
            <div className="grid grid-cols-2 gap-3 px-3">
              {BLUEPRINTS.map(bp => (
                <div 
                  key={bp} 
                  onClick={() => setActiveBlueprint(bp)}
                  className={`relative cursor-pointer rounded-lg p-3 border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    activeBlueprint === bp 
                      ? "border-[#6C63FF] bg-[#6C63FF]/10 text-white" 
                      : "border-slate-700/50 bg-white/5 text-slate-300 hover:border-slate-500 hover:bg-white/10"
                  }`}
                >
                  <LayoutIcon type={bp} />
                  <span className="text-[10px] text-center font-medium leading-tight">
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
              style={{ fontSize: '11px', color: '#6C63FF', padding: '16px 12px 8px' }}
            >
              2. SELECT SECTIONS (LAYER 2)
            </h3>
            <div className="px-3 flex flex-col gap-2">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={sections.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sections.map(section => (
                    <SortableSectionItem 
                      key={section.id} 
                      section={section as any} 
                      onVisibilityChange={toggleSection as any}
                      onVariantChange={changeVariant as any}
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
              style={{ fontSize: '11px', color: '#6C63FF', padding: '16px 12px 8px' }}
            >
              3. SELECT THEME (LAYER 3)
            </h3>
            <div className="grid grid-cols-2 gap-3 px-3">
              {Object.values(prebuiltThemes).map(theme => (
                <div 
                  key={theme.id} 
                  onClick={() => setActiveThemeId(theme.id)}
                  className={`relative cursor-pointer rounded-lg px-3 py-3 border-2 transition-all flex flex-col items-start gap-2 ${
                    activeThemeId === theme.id 
                      ? "border-[#6C63FF] bg-[#6C63FF]/10 text-white" 
                      : "border-slate-700/50 bg-white/5 text-slate-300 hover:border-slate-500 hover:bg-white/10"
                  }`}
                >
                  <div 
                    className="w-5 h-5 rounded-full shadow-sm flex-shrink-0" 
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.backgroundColor} 50%, ${theme.accentColor} 50%)`,
                      border: `1px solid ${theme.textPrimary}20`
                    }} 
                  />
                  <span className="text-[10px] font-medium leading-tight truncate w-full">
                    {theme.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN PREVIEW STUDIO */}
      <div className="flex-1 flex flex-col pt-8 items-center overflow-y-auto bg-slate-100/50 relative custom-scrollbar">
        {/* Status Indicators */}
        <div className="mb-6 flex gap-4 mt-2">
          <div 
            className="flex items-center gap-2 font-medium text-xs px-3 py-1.5 rounded-md shadow-sm"
            style={{ backgroundColor: "#1a1a2e", border: "1px solid #6C63FF", color: "white" }}
          >
            <span className="opacity-70">Blueprint:</span> 
            <span>{activeBlueprint.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>
          <div 
            className="flex items-center gap-2 font-medium text-xs px-3 py-1.5 rounded-md shadow-sm"
            style={{ backgroundColor: "#1a1a2e", border: "1px solid #6C63FF", color: "white" }}
          >
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: prebuiltThemes[activeThemeId].accentColor }} 
            />
            <span>{prebuiltThemes[activeThemeId].name}</span>
          </div>
        </div>
        
        <div className="pb-24 transform-gpu scale-75 xl:scale-90 2xl:scale-100 origin-top flex justify-center w-full">
          <Card className="shadow-2xl overflow-hidden pointer-events-none">
            <TemplateComposer config={config as any} cvData={MOCK_CV_DATA as any} sectionConfig={sections as any} />
          </Card>
        </div>
      </div>
    </div>
  );
}
