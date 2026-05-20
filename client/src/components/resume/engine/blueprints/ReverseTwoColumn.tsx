import React from "react";
import { BlueprintProps } from "@/types/template";

export default function ReverseTwoColumn({ theme, header, sidebar, main }: BlueprintProps) {
  return (
    <div 
      className={`w-[794px] min-h-[1123px] mx-auto overflow-hidden flex flex-col ${theme.fontBody}`}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="w-full p-10 pb-6 shrink-0" style={{ color: theme.textPrimary }}>
        {header}
      </div>
      
      <div className="flex flex-1">
        <div 
          className="w-[65%] p-10 pt-4 flex flex-col gap-6"
          style={{ color: theme.textPrimary }}
        >
          {main}
        </div>
        
        <div 
          className="w-[35%] p-8 pt-4 shrink-0 flex flex-col gap-6"
          style={{ backgroundColor: theme.sidebarColor, color: theme.textSecondary }}
        >
          {sidebar}
        </div>
      </div>
    </div>
  );
}
