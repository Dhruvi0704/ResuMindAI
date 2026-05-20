import React from "react";
import { BlueprintProps } from "@/types/template";

export default function ClassicTwoColumn({ theme, header, sidebar, main }: BlueprintProps) {
  return (
    <div 
      className={`w-[794px] min-h-[1123px] mx-auto overflow-hidden flex ${theme.fontBody}`}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div 
        className="w-[35%] p-8 shrink-0 flex flex-col gap-6"
        style={{ backgroundColor: theme.sidebarColor, color: theme.textSecondary }}
      >
        <div className="mb-4">
          {header}
        </div>
        {sidebar}
      </div>
      
      <div 
        className="w-[65%] p-10 flex flex-col gap-6"
        style={{ color: theme.textPrimary }}
      >
        {main}
      </div>
    </div>
  );
}
