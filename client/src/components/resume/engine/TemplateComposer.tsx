import React, { useState } from "react";
import { TemplateComposerConfig } from "@/types/template";
import EditableField from "./EditableField";

// Blueprints
import SingleColumn from "./blueprints/SingleColumn";
import ClassicTwoColumn from "./blueprints/ClassicTwoColumn";
import ReverseTwoColumn from "./blueprints/ReverseTwoColumn";
import HeaderBand from "./blueprints/HeaderBand";
import TimelineLeft from "./blueprints/TimelineLeft";
import ModernSplit from "./blueprints/ModernSplit";
import MinimalTop from "./blueprints/MinimalTop";
import AcademicFormal from "./blueprints/AcademicFormal";

// Dedicated Sections
import HeaderSection from "./sections/HeaderSection";
import SummarySection from "./sections/SummarySection";
import ExperienceSection from "./sections/ExperienceSection";
import EducationSection from "./sections/EducationSection";
import SkillsSection from "./sections/SkillsSection";
import PublicationsSection from "./sections/PublicationsSection";
import ProjectsSection from "./sections/ProjectsSection";
import CertificationsSection from "./sections/CertificationsSection";
import AwardsSection from "./sections/AwardsSection";
import LanguagesSection from "./sections/LanguagesSection";
import ResearchSection from "./sections/ResearchSection";
import GrantsSection from "./sections/GrantsSection";
import ConferencesSection from "./sections/ConferencesSection";
import ReferencesSection from "./sections/ReferencesSection";
import { useResume } from "@/contexts/ResumeContext";

interface SectionConfig {
  id: string;
  visible: boolean;
  locked?: boolean;
  order: number;
  variant: string;
  variantOptions: string[];
}

interface TemplateComposerProps {
  config: TemplateComposerConfig; // Keeping it for blueprint/theme
  sectionConfig: SectionConfig[];
  cvData: any; // Using any for the mock example, ideally ResumeData
  isPrinting?: boolean;
}

export default function TemplateComposer({ config, sectionConfig, cvData, isPrinting = false }: TemplateComposerProps) {
  const { blueprint, theme } = config;
  const resumeContext = useResume();
  const contextData = resumeContext?.state?.resumeData;
  
  console.log('🎨 Rendering with sectionConfig:', sectionConfig);
  console.log('Context CV Data:', contextData);

  // Strip component prop drilling explicitly enforcing contextual truth.
  const activeData: any = contextData || {};

  const normalizedData = {
    ...activeData,
    personal: activeData.personal,
    summary: activeData.personal?.professionalSummary || activeData.summary || '',
    education: activeData.education || [],
    experience: activeData.experience || [],
    skills: activeData.skills || []
  };

  const getVariant = (id: string) => sectionConfig.find((s) => s.id === id)?.variant ?? 'default';

  const renderSectionNode = (sectionId: string) => {
    const variant = getVariant(sectionId);
    switch(sectionId) {
      case 'header':         return <HeaderSection data={{
        ...normalizedData.personal, 
        name: normalizedData.personal?.fullName || '',
        title: normalizedData.personal?.jobTitle || ''
      }} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'summary':        return <SummarySection data={normalizedData.summary} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'experience':     return <ExperienceSection data={normalizedData.experience} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'education':      return <EducationSection data={normalizedData.education} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'skills':         return <SkillsSection data={normalizedData.skills} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'publications':   return <PublicationsSection data={activeData.publications || []} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'projects':       return <ProjectsSection data={activeData.projects || []} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'certifications': return <CertificationsSection data={activeData.certifications || []} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'awards':         return <AwardsSection data={activeData.awards || []} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'languages':      return <LanguagesSection data={activeData.languages || []} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'research':       return <ResearchSection data={activeData.research || []} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'grants':         return <GrantsSection data={activeData.grants || []} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'conferences':    return <ConferencesSection data={activeData.conferences || []} variant={variant} theme={theme} isPrinting={isPrinting} />;
      case 'references':     return <ReferencesSection data={activeData.references || []} variant={variant} theme={theme} isPrinting={isPrinting} />;
      default:               return null;
    }
  };

  const visibleSections = [...sectionConfig]
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  const headerId = visibleSections.find(s => s.id === 'header');
  const headerNode = headerId ? renderSectionNode('header') : renderSectionNode('header');
  
  // Distribute sections based on layout column structure
  const sidebarSections = ['skills', 'education', 'languages', 'certifications'];
  
  // If the blueprint supports a sidebar, partition the active sections
  const hasSidebar = ["ClassicTwoColumn", "ReverseTwoColumn", "TimelineLeft", "ModernSplit"].includes(blueprint);
  
  const sidebarItems: React.ReactNode[] = [];
  const mainItems: React.ReactNode[] = [];

  visibleSections.forEach(s => {
    const id = s.id;
    if (id === 'header') return; // Handled separately
    
    const node = renderSectionNode(id);
    if (!node) return;

    if (hasSidebar && sidebarSections.includes(id)) {
      sidebarItems.push(<React.Fragment key={id}>{node}</React.Fragment>);
    } else {
      mainItems.push(<React.Fragment key={id}>{node}</React.Fragment>);
    }
  });

  const sidebarNode = <>{sidebarItems}</>;
  const mainNode = <>{mainItems}</>;

  const blueprintProps = {
    theme,
    header: headerNode,
    sidebar: sidebarNode,
    main: mainNode
  };

  // Dynamically select blueprint
  switch (blueprint) {
    case "SingleColumn": return <SingleColumn {...blueprintProps} />;
    case "ClassicTwoColumn": return <ClassicTwoColumn {...blueprintProps} />;
    case "ReverseTwoColumn": return <ReverseTwoColumn {...blueprintProps} />;
    case "HeaderBand": return <HeaderBand {...blueprintProps} />;
    case "TimelineLeft": return <TimelineLeft {...blueprintProps} />;
    case "ModernSplit": return <ModernSplit {...blueprintProps} />;
    case "MinimalTop": return <MinimalTop {...blueprintProps} />;
    case "AcademicFormal": return <AcademicFormal {...blueprintProps} />;
    default: return <SingleColumn {...blueprintProps} />;
  }
}
