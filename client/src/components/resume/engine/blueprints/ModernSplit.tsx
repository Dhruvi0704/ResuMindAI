import React from "react";
import { BlueprintProps } from "@/types/template";

export default function ModernSplit({ theme, header, sidebar, main }: BlueprintProps) {
  return (
    <div 
      className={`w-[794px] min-h-[1123px] mx-auto overflow-hidden flex flex-col ${theme.fontBody}`}
      style={{ backgroundColor: theme.backgroundColor, color: theme.textPrimary }}
    >
      <div className="relative w-full overflow-hidden shrink-0">
        <div 
          className="absolute top-[-50%] right-[-10%] w-[120%] h-[150%] diagonal-split -z-10"
          style={{ 
            backgroundColor: theme.secondaryColor, 
            transform: 'rotate(-5deg)' 
          }}
        />
        <div className="p-12 relative z-10 flex">
          <div className="w-2/3 pr-8">
            {header}
          </div>
          <div className="w-1/3 text-right">
            {/* Visual anchor / Logo space */}
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 px-12 pb-12 pt-6">
        <div className="w-2/3 pr-10 flex flex-col gap-6">
          {main}
        </div>
        <div className="w-1/3 flex flex-col gap-6 border-l pl-8" style={{ borderColor: theme.sidebarColor }}>
          {sidebar}
        </div>
      </div>
    </div>
  );
}
