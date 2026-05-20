import React from "react";
import { BlueprintProps } from "@/types/template";

export default function SingleColumn({ theme, header, main }: BlueprintProps) {
  return (
    <div 
      className={`w-[794px] min-h-[1123px] mx-auto overflow-hidden relative ${theme.fontBody}`}
      style={{ 
        backgroundColor: theme.backgroundColor, 
        color: theme.textPrimary 
      }}
    >
      <div className="p-12 pb-8 text-center border-b-2" style={{ borderColor: theme.accentColor }}>
        {header}
      </div>
      
      <div className="p-12 pt-8 flex flex-col gap-6">
        {main}
      </div>
    </div>
  );
}
