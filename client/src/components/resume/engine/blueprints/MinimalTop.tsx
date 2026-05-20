import React from "react";
import { BlueprintProps } from "@/types/template";

export default function MinimalTop({ theme, header, main }: BlueprintProps) {
  return (
    <div 
      className={`w-[794px] min-h-[1123px] mx-auto overflow-hidden flex flex-col ${theme.fontBody}`}
      style={{ backgroundColor: theme.backgroundColor, color: theme.textPrimary }}
    >
      <div className="p-14 pb-8 space-y-4 text-center">
        {header}
      </div>
      
      <div className="px-16 pb-14 flex flex-col gap-8">
        {main}
      </div>
    </div>
  );
}
