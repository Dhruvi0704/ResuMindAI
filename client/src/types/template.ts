export interface ThemeConfig {
  id: string;
  name: string;
  accentColor: string;
  secondaryColor: string;
  backgroundColor: string;
  sidebarColor: string;
  textPrimary: string;
  textSecondary: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
  spacing: "compact" | "normal" | "relaxed";
  sectionDivider: "line" | "dot" | "space" | "colored";
}

export type BlueprintType = 
  | "SingleColumn"
  | "ClassicTwoColumn"
  | "ReverseTwoColumn"
  | "HeaderBand"
  | "TimelineLeft"
  | "ModernSplit"
  | "MinimalTop"
  | "AcademicFormal";

export interface BlueprintProps {
  theme: ThemeConfig;
  header: React.ReactNode;
  sidebar?: React.ReactNode;
  main: React.ReactNode;
}

export interface TemplateComposerConfig {
  blueprint: BlueprintType;
  theme: ThemeConfig;
  sectionOrder: string[];
  sectionVariants: Record<string, string>;
}
