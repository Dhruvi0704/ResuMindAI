import React from "react";
import { BlueprintProps } from "@/types/template";

export default function HeaderBand({ theme, header, main }: BlueprintProps) {
  return (
    <div 
      className={`w-[794px] min-h-[1123px] mx-auto overflow-hidden flex flex-col ${theme.fontBody}`}
      style={{ backgroundColor: theme.backgroundColor, color: theme.textPrimary }}
    >
      <div 
        className="w-full px-12 py-10 shrink-0 text-white"
        style={{ backgroundColor: theme.accentColor }}
      >
        {header}
      </div>
      
      <div className="w-full p-12 flex flex-col gap-6">
        {main}
      </div>
    </div>
  );
}
