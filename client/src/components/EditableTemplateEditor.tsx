import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Edit2, Upload, User, LayoutTemplate } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { CVFormData, defaultCVData } from "@/types/cv";
import { useResume } from "@/contexts/ResumeContext";
import StructuredCVForm from "./StructuredCVForm";
import GapAnalyzer from "./GapAnalyzer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Target } from "lucide-react";

interface EditableTemplateEditorProps {
  variant: "professional" | "modern-photo" | "executive" | "creative-photo" | "minimal" | "two-column" | "sidebar-photo" | "elegant";
  templateName: string;
  initialData?: CVFormData;
  onSave?: (data: CVFormData) => void;
  isSaving?: boolean;
}

export default function EditableTemplateEditor({ variant, templateName, initialData, onSave, isSaving }: EditableTemplateEditorProps) {
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [formData, setFormData] = useState<CVFormData>(initialData || defaultCVData);
  const { state: resumeContextState } = useResume();
  
  // Get report for heatmap
  const gapReport = resumeContextState.gapReport;
  
  const handleApplySuggestion = (sectionName: string, suggestion: string) => {
    alert(`Suggestion for ${sectionName}: \n\n${suggestion}\n\nPlease update the respective field in the Editor.`);
  };

  const getHeatmapClass = (sectionName: string) => {
    if (!gapReport?.sections || !gapReport.sections[sectionName]) return "";
    const status = gapReport.sections[sectionName].status;
    if (status === "strong") return "ring-2 ring-emerald-400 bg-emerald-50/30 rounded px-2 -mx-2 transition-all relative";
    if (status === "weak") return "ring-2 ring-amber-400 bg-amber-50/30 rounded px-2 -mx-2 transition-all relative";
    if (status === "missing") return "ring-2 ring-red-400 bg-red-50/30 rounded px-2 -mx-2 transition-all relative opacity-80";
    return "";
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById("editable-template-preview");
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`resume-${templateName}.pdf`);
  };

  const renderPhotoCircle = (size: string = "w-24 h-24") => (
    <div className={`${size} bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {photoUrl ? (
        <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <User className={`${size === "w-24 h-24" ? "w-12 h-12" : size === "w-32 h-32" ? "w-16 h-16" : "w-10 h-10"} text-white`} />
      )}
    </div>
  );

  const renderPhotoSquare = () => (
    <div className="w-32 h-32 bg-gray-300 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
      {photoUrl ? (
        <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <User className="w-16 h-16 text-gray-600" />
      )}
    </div>
  );

  const renderSkillsList = (className = "text-gray-700") => {
    const wrapperClass = gapReport ? getHeatmapClass("Skills") : "";
    if (formData.structuredSkills) {
      return (
        <div className={`space-y-1 w-full ${className} ${wrapperClass}`}>
          {formData.structuredSkills.technical?.length > 0 && <p><strong>Tech:</strong> {formData.structuredSkills.technical.join(" • ")}</p>}
          {formData.structuredSkills.frameworks?.length > 0 && <p><strong>Frameworks:</strong> {formData.structuredSkills.frameworks.join(" • ")}</p>}
          {formData.structuredSkills.softSkills?.length > 0 && <p><strong>Soft:</strong> {formData.structuredSkills.softSkills.join(" • ")}</p>}
          {formData.structuredSkills.languages?.length > 0 && <p><strong>Lang:</strong> {formData.structuredSkills.languages.join(" • ")}</p>}
        </div>
      );
    }
    return <p contentEditable suppressContentEditableWarning className={`${className} ${wrapperClass}`}>{formData.skills}</p>;
  };

  const renderExperiences = (titleClass = "font-bold text-xl mb-3 uppercase tracking-wide", showLines = false) => {
    if (!formData.experiences || formData.experiences.length === 0) return null;
    return (
      <div className={`mb-6 ${gapReport ? getHeatmapClass("Research Experience") : ""}`}>
        <h2 className={titleClass}>Experience</h2>
        <div className={`space-y-4 ${showLines ? "border-l-4 border-gray-300 pl-6" : ""}`}>
          {formData.experiences.map((exp, i) => (
            <div key={i}>
              <p className="font-semibold text-lg">{exp.title}</p>
              <p className="text-gray-600">{exp.company} {exp.period && `| ${exp.period}`}</p>
              {exp.description && <p className="mt-2 text-gray-700 whitespace-pre-wrap">{exp.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProjects = (titleClass = "font-bold text-xl mb-3 uppercase tracking-wide") => {
    if (!formData.projects || formData.projects.length === 0) return null;
    return (
      <div className={`mb-6 ${gapReport ? getHeatmapClass("Projects & Publications") : ""}`}>
        <h2 className={titleClass}>Projects & Research</h2>
        <div className="space-y-4">
          {formData.projects.map((proj, i) => (
            <div key={i}>
              <p className="font-semibold text-lg">{proj.name} {proj.tech && <span className="font-normal text-sm text-gray-500">| {proj.tech}</span>}</p>
              {proj.description && <p className="mt-1 text-gray-700 whitespace-pre-wrap">{proj.description}</p>}
              {proj.impact && <p className="mt-1 font-medium text-gray-800">Impact: {proj.impact}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProfessionalTemplate = () => (
    <div className="w-full bg-white text-black p-12 min-h-[1100px]">
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
        <h1 className="font-bold text-4xl mb-2 uppercase tracking-wide">{formData.name}</h1>
        <p className="text-lg text-gray-600 mb-3">{formData.jobTitle}</p>
        <div className="flex justify-center gap-4 text-sm text-gray-600 flex-wrap">
          {formData.phone && <span>📞 {formData.phone}</span>}
          {formData.email && <span>✉ {formData.email}</span>}
          {formData.linkedin && <span>🔗 {formData.linkedin}</span>}
          {formData.portfolio && <span>🔗 {formData.portfolio}</span>}
          {formData.location && <span>📍 {formData.location}</span>}
        </div>
      </div>
      <div className="space-y-6">
        {formData.summary && (
          <div>
            <h2 className="font-bold text-xl mb-3 uppercase tracking-wide">Summary</h2>
            <p className="text-gray-700 leading-relaxed">{formData.summary}</p>
          </div>
        )}
        
        {renderExperiences()}
        
        {renderProjects()}

        {formData.education && (
          <div className={`${gapReport ? getHeatmapClass("Education") : ""}`}>
            <h2 className="font-bold text-xl mb-3 uppercase tracking-wide">Education</h2>
            <p className="font-semibold text-lg">{formData.education}</p>
            <p className="text-gray-600 italic">{formData.educationSchool} {formData.educationYear && `• ${formData.educationYear}`}</p>
          </div>
        )}
        
        {(formData.skills || formData.structuredSkills) && (
          <div>
            <h2 className="font-bold text-xl mb-3 uppercase tracking-wide">Technical Skills</h2>
            {renderSkillsList()}
          </div>
        )}
      </div>
    </div>
  );

  const renderModernPhotoTemplate = () => (
    <div className="w-full bg-white text-black p-12 min-h-[1100px]">
      <div className="flex items-start gap-6 mb-8 pb-6 border-b-4 border-gray-800">
        {renderPhotoCircle("w-32 h-32")}
        <div className="flex-1">
          <h1 className="font-bold text-4xl mb-2">{formData.name}</h1>
          <p className="text-xl text-gray-600 mb-3">{formData.jobTitle}</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{formData.email} • {formData.phone}</p>
            <p>{formData.linkedin} {formData.portfolio && `• ${formData.portfolio}`}</p>
            <p>{formData.location}</p>
          </div>
        </div>
      </div>
      
      {formData.summary && <p className="text-gray-700 leading-relaxed mb-6">{formData.summary}</p>}

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          {renderExperiences("font-bold text-xl mb-3 text-gray-800 uppercase")}
          {renderProjects("font-bold text-xl mb-3 text-gray-800 uppercase")}
        </div>
        <div className="space-y-6">
          {formData.education && (
            <div className={`${gapReport ? getHeatmapClass("Education") : ""}`}>
              <h2 className="font-bold text-xl mb-3 text-gray-800 uppercase">Education</h2>
              <p className="font-semibold">{formData.education}</p>
              <p className="text-gray-600">{formData.educationSchool} {formData.educationYear}</p>
            </div>
          )}
          {(formData.skills || formData.structuredSkills) && (
            <div>
              <h2 className="font-bold text-xl mb-3 text-gray-800 uppercase">Skills</h2>
              {renderSkillsList()}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderExecutiveTemplate = () => (
    <div className="w-full bg-white text-black p-12 min-h-[1100px]">
      <div className="flex gap-8 mb-8">
        {renderPhotoSquare()}
        <div className="flex-1">
          <h1 className="font-bold text-5xl mb-3">{formData.name}</h1>
          <p className="text-2xl text-gray-600 mb-4">{formData.jobTitle}</p>
          <p className="text-gray-600">{formData.email} • {formData.location}</p>
          <p className="text-gray-600">{formData.phone} • {formData.linkedin}</p>
        </div>
      </div>
      <div className="space-y-6">
        {formData.summary && (
          <div className="bg-gray-50 p-6 rounded">
            <h2 className="font-bold text-xl mb-3 uppercase">Professional Summary</h2>
            <p className="text-gray-700 leading-relaxed">{formData.summary}</p>
          </div>
        )}
        
        {renderExperiences("font-bold text-xl mb-3 uppercase")}
        {renderProjects("font-bold text-xl mb-3 uppercase")}
        
        <div className="grid grid-cols-2 gap-6">
          {formData.education && (
            <div className={`${gapReport ? getHeatmapClass("Education") : ""}`}>
              <h2 className="font-bold text-xl mb-3 uppercase">Education</h2>
              <p className="font-semibold">{formData.education}</p>
              <p className="text-gray-600">{formData.educationSchool} • {formData.educationYear}</p>
            </div>
          )}
          <div>
              <h2 className="font-bold text-xl mb-3 uppercase">Expertise</h2>
              {renderSkillsList()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreativePhotoTemplate = () => (
    <div className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 text-black p-12 min-h-[1100px]">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-16 h-16 text-white" />
          )}
        </div>
        <div>
          <h1 className="font-bold text-4xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {formData.name}
          </h1>
          <p className="text-2xl text-gray-700">{formData.jobTitle}</p>
          <p className="text-sm text-gray-600 mt-2">{formData.email} | {formData.phone} | {formData.location}</p>
        </div>
      </div>
      <div className="space-y-6">
        {formData.summary && (
          <div className="bg-white/80 backdrop-blur p-6 rounded-xl">
            <h2 className="font-bold text-xl text-indigo-600 mb-3">About Me</h2>
            <p className="text-gray-700">{formData.summary}</p>
          </div>
        )}
        {formData.experiences.length > 0 && (
          <div className="bg-white/80 backdrop-blur p-6 rounded-xl">
            {renderExperiences("font-bold text-xl text-indigo-600 mb-3")}
          </div>
        )}
        {formData.projects.length > 0 && (
          <div className="bg-white/80 backdrop-blur p-6 rounded-xl">
            {renderProjects("font-bold text-xl text-indigo-600 mb-3")}
          </div>
        )}
        <div className="grid grid-cols-2 gap-6">
          {formData.education && (
            <div className={`bg-white/80 backdrop-blur p-6 rounded-xl ${gapReport ? getHeatmapClass("Education") : ""}`}>
              <h2 className="font-bold text-xl text-indigo-600 mb-3">Education</h2>
              <p className="font-semibold">{formData.education}</p>
              <p className="text-gray-600">{formData.educationSchool} {formData.educationYear}</p>
            </div>
          )}
          <div className="bg-white/80 backdrop-blur p-6 rounded-xl">
            <h2 className="font-bold text-xl text-indigo-600 mb-3">Skills</h2>
            {renderSkillsList()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMinimalTemplate = () => (
    <div className="w-full bg-white text-black p-12 min-h-[1100px]">
      <h1 className="font-bold text-4xl mb-2">{formData.name}</h1>
      <div className="text-gray-600 mb-8 flex gap-4 flex-wrap">
        {formData.email && <span>{formData.email} •</span>}
        {formData.phone && <span>{formData.phone} •</span>}
        {formData.linkedin && <span>{formData.linkedin} •</span>}
        {formData.portfolio && <span>{formData.portfolio}</span>}
      </div>
      
      {formData.summary && <p className="mb-8">{formData.summary}</p>}

      <div className="space-y-8">
        {renderExperiences("font-bold text-2xl mb-4 uppercase tracking-wide", true)}
        {renderProjects("font-bold text-2xl mb-4 uppercase tracking-wide")}

        {formData.education && (
          <div className={`${gapReport ? getHeatmapClass("Education") : ""}`}>
            <h2 className="font-bold text-2xl mb-4 uppercase tracking-wide">Education</h2>
            <p className="font-semibold text-lg">{formData.education}</p>
            <p className="text-gray-600">{formData.educationSchool} | {formData.educationYear}</p>
          </div>
        )}
        {(formData.skills || formData.structuredSkills) && (
          <div>
            <h2 className="font-bold text-2xl mb-4 uppercase tracking-wide">Skills</h2>
            {renderSkillsList()}
          </div>
        )}
      </div>
    </div>
  );

  const renderTwoColumnTemplate = () => (
    <div className="w-full bg-white text-black p-8 min-h-[1100px]">
      <div className="flex gap-8">
        <div className="w-2/5 space-y-6">
          <div className="w-40 h-40 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-20 h-20 text-white" />
            )}
          </div>
          <div className="text-center">
            <h2 className="font-bold text-xl mb-4">CONTACT</h2>
            <p className="text-sm text-gray-700 mb-2">📞 {formData.phone}</p>
            <p className="text-sm text-gray-700 mb-2">✉ {formData.email}</p>
            <p className="text-sm text-gray-700 mb-2">🔗 {formData.linkedin}</p>
            <p className="text-sm text-gray-700">📍 {formData.location}</p>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-4">SKILLS</h2>
            {renderSkillsList("text-sm text-gray-700")}
          </div>
        </div>
        <div className="w-3/5 space-y-6">
          <div>
            <h1 className="font-bold text-4xl mb-2">{formData.name}</h1>
            <p className="text-xl text-gray-600 mb-6">{formData.jobTitle}</p>
            {formData.summary && <p className="text-sm text-gray-800 mb-6">{formData.summary}</p>}
          </div>
          
          {renderExperiences("font-bold text-xl mb-3")}
          {renderProjects("font-bold text-xl mb-3")}
          
          {formData.education && (
            <div className={`${gapReport ? getHeatmapClass("Education") : ""}`}>
              <h2 className="font-bold text-xl mb-3">EDUCATION</h2>
              <p className="font-semibold">{formData.education}</p>
              <p className="text-gray-600">{formData.educationSchool}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSidebarPhotoTemplate = () => (
    <div className="w-full bg-white text-black flex min-h-[1100px]">
      <div className="w-1/3 bg-slate-700 text-white p-8 space-y-6">
        <div className="w-32 h-32 bg-slate-500 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-16 h-16 text-white" />
          )}
        </div>
        <div className="text-center">
          <h2 className="font-bold text-xl mb-4">CONTACT</h2>
          <p className="text-sm text-slate-300 mb-2">{formData.phone}</p>
          <p className="text-sm text-slate-300 mb-2">{formData.email}</p>
          <p className="text-sm text-slate-300 mb-2">{formData.linkedin}</p>
          <p className="text-sm text-slate-300">{formData.location}</p>
        </div>
        <div>
          <h2 className="font-bold text-xl mb-4">SKILLS</h2>
          {renderSkillsList("text-sm text-slate-300")}
        </div>
      </div>
      <div className="w-2/3 p-12 space-y-6">
        <div>
          <h1 className="font-bold text-4xl mb-2">{formData.name}</h1>
          <p className="text-xl text-gray-600 mb-6">{formData.jobTitle}</p>
          {formData.summary && <p className="text-gray-800 mb-6">{formData.summary}</p>}
        </div>
        
        {renderExperiences("font-bold text-2xl mb-4")}
        {renderProjects("font-bold text-2xl mb-4")}
        
        {formData.education && (
          <div className={`${gapReport ? getHeatmapClass("Education") : ""}`}>
            <h2 className="font-bold text-2xl mb-4">EDUCATION</h2>
            <p className="font-semibold text-lg">{formData.education}</p>
            <p className="text-gray-600">{formData.educationSchool} {formData.educationYear}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderElegantTemplate = () => (
    <div className="w-full bg-gradient-to-b from-slate-50 to-white text-black p-12 min-h-[1100px]">
      <div className="border-b-4 border-slate-800 pb-6 mb-8">
        <h1 className="font-bold text-5xl tracking-wide mb-2">{formData.name}</h1>
        <p className="text-xl text-gray-600">{formData.jobTitle}</p>
      </div>
      <div className="flex gap-8 text-sm text-gray-600 mb-8 flex-wrap">
        {formData.email && <span>📧 {formData.email}</span>}
        {formData.phone && <span>📞 {formData.phone}</span>}
        {formData.location && <span>📍 {formData.location}</span>}
        {formData.linkedin && <span>🔗 {formData.linkedin}</span>}
      </div>
      
      {formData.summary && <p className="mb-8 text-lg text-gray-800 leading-relaxed font-serif">{formData.summary}</p>}
      
      <div className="space-y-8">
        {renderExperiences("font-bold text-2xl tracking-wide mb-4 uppercase")}
        {renderProjects("font-bold text-2xl tracking-wide mb-4 uppercase")}
        
        <div className="grid grid-cols-2 gap-8">
          {formData.education && (
            <div className={`${gapReport ? getHeatmapClass("Education") : ""}`}>
              <h2 className="font-bold text-2xl tracking-wide mb-4 uppercase">Education</h2>
              <p className="font-semibold text-lg">{formData.education}</p>
              <p className="text-gray-600">{formData.educationSchool} • {formData.educationYear}</p>
            </div>
          )}
          
          {(formData.skills || formData.structuredSkills) && (
            <div>
              <h2 className="font-bold text-2xl tracking-wide mb-4 uppercase">Skills & Expertise</h2>
              {renderSkillsList()}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTemplate = () => {
    switch (variant) {
      case "professional": return renderProfessionalTemplate();
      case "modern-photo": return renderModernPhotoTemplate();
      case "executive": return renderExecutiveTemplate();
      case "creative-photo": return renderCreativePhotoTemplate();
      case "minimal": return renderMinimalTemplate();
      case "two-column": return renderTwoColumnTemplate();
      case "sidebar-photo": return renderSidebarPhotoTemplate();
      case "elegant": return renderElegantTemplate();
      default: return renderMinimalTemplate();
    }
  };

  const hasPhoto = ["modern-photo", "executive", "creative-photo", "two-column", "sidebar-photo"].includes(variant);

  return (
    <div className="space-y-6">
      <Card className="p-6 border-b border-border shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Resume Builder - {templateName}</h2>
          </div>
          <div className="flex gap-2">
            {hasPhoto && (
              <Button variant="outline" asChild data-testid="button-upload-photo">
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </Button>
            )}
            <Button onClick={handleDownload} variant="outline" data-testid="button-download-resume">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={() => onSave?.(formData)} disabled={isSaving} data-testid="button-save-resume">
              {isSaving ? "Saving..." : "Save Resume"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-200px)]">
        {/* Left Side: Smart Input Form & Gap Analyzer */}
        <div className="w-full lg:w-[45%] h-full flex flex-col pl-1">
          <Tabs defaultValue="editor" className="h-full flex flex-col w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 shrink-0">
              <TabsTrigger value="editor">
                <Edit2 className="w-4 h-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="analyzer" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
                <Target className="w-4 h-4 mr-2" />
                Gap Analyzer
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex-1 overflow-y-auto pr-2 custom-scrollbar mt-0 pb-10">
              <StructuredCVForm data={formData} onChange={setFormData} />
            </TabsContent>
            <TabsContent value="analyzer" className="flex-1 overflow-hidden mt-0">
              <GapAnalyzer 
                currentResumeData={formData} 
                onApplySuggestion={handleApplySuggestion} 
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side: Resume Preview */}
        <Card className="w-full lg:w-[55%] h-full overflow-hidden bg-muted/20 relative rounded-xl border-border/50">
          <div className="w-full h-full overflow-y-auto p-4 md:p-8 flex justify-center custom-scrollbar">
            <div className="w-[850px] min-w-[850px] transform origin-top scale-[0.5] sm:scale-[0.7] lg:scale-[0.8] xl:scale-[0.9] 2xl:scale-100 transition-transform bg-white shadow-xl mb-20">
              <div id="editable-template-preview" data-testid="editable-resume-preview">
                {renderTemplate()}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
