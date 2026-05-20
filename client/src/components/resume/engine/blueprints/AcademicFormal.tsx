import React from "react";
import { BlueprintProps } from "@/types/template";

export default function AcademicFormal({ theme, header, main }: BlueprintProps) {
  return (
    <div 
      className={`w-[794px] min-h-[1123px] mx-auto overflow-hidden flex flex-col ${theme.fontBody}`}
      style={{ backgroundColor: theme.backgroundColor, color: theme.textPrimary }}
    >
      <div 
        className="w-full px-16 py-12 text-center border-b-[3px] border-double shrink-0"
        style={{ borderColor: theme.accentColor }}
      >
        {header}
      </div>
      
      <div className="w-full px-16 py-10 flex flex-col gap-6">
        {main}
      </div>
    </div>
  );
}
