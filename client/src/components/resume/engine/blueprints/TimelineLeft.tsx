import React from "react";
import { BlueprintProps } from "@/types/template";

export default function TimelineLeft({ theme, header, sidebar, main }: BlueprintProps) {
  return (
    <div 
      className={`w-[794px] min-h-[1123px] mx-auto overflow-hidden flex ${theme.fontBody}`}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div 
        className="w-[30%] p-10 shrink-0 flex flex-col border-r shadow-sm relative z-10"
        style={{ 
          backgroundColor: theme.sidebarColor, 
          borderColor: theme.secondaryColor,
          color: theme.textSecondary 
        }}
      >
        <div className="mb-8">
          {header}
        </div>
        <div className="flex flex-col gap-6">
          {sidebar}
        </div>
      </div>
      
      <div 
        className="w-[70%] p-10 pl-12 flex flex-col gap-6 relative"
        style={{ color: theme.textPrimary }}
      >
        {/* Decorative timeline spine */}
        <div 
          className="absolute left-8 top-10 bottom-10 w-px opacity-30" 
          style={{ backgroundColor: theme.accentColor }} 
        />
        {main}
      </div>
    </div>
  );
}
