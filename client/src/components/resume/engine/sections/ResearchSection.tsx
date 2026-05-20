import React from "react";

export default function ResearchSection({ data, variant, theme }: any) {
  if (!data || data.length === 0) return null;
  console.log(`📦 research rendering variant:`, variant);

  const research = Array.isArray(data) ? data : [{
    title: typeof data === 'string' ? data : data.title || "Research Topic",
    institution: data.institution || "",
    year: data.year || "",
    description: data.description || ""
  }];

  switch (variant) {
    case "compact":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Research
          </h2>
          <div className="space-y-2">
            {research.map((res: any, i: number) => (
              <div key={i} className="text-sm">
                <span className="font-bold text-slate-800 dark:text-slate-100">{res.title}</span> 
                {res.institution && <span className="opacity-80 italic mx-1">{res.institution}</span>}
                {res.year && <span className="opacity-70 font-medium ml-1">({res.year})</span>}
              </div>
            ))}
          </div>
        </div>
      );
    case "detailed":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-4 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Research Experience
          </h2>
          <div className="space-y-5">
            {research.map((res: any, i: number) => (
              <div key={i} className="border-l-2 pl-4 border-slate-200 dark:border-slate-800">
                <h3 className="text-[15px] font-bold" style={{ color: theme.textPrimary }}>{res.title}</h3>
                <div className="flex items-center gap-2 text-sm font-medium opacity-90 mb-2">
                  <span style={{ color: theme.accentColor }}>{res.institution}</span>
                  {res.year && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{res.year}</span>}
                </div>
                {res.description && (
                  <p className="text-sm opacity-80 leading-relaxed">
                    {res.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    case "default":
    default:
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-4 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Research
          </h2>
          <div className="space-y-4">
            {research.map((res: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-[15px] font-bold" style={{ color: theme.textPrimary }}>{res.title}</h3>
                  <span className="text-sm font-medium opacity-80">{res.year}</span>
                </div>
                {res.institution && <div className="text-sm font-medium mb-1" style={{ color: theme.accentColor }}>{res.institution}</div>}
                {res.description && (
                  <p className="text-sm opacity-90 leading-relaxed">
                    {res.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
  }
}
