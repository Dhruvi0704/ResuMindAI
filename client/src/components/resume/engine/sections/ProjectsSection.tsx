import React from "react";

export default function ProjectsSection({ data, variant, theme }: any) {
  if (!data || data.length === 0) return null;
  console.log(`📦 projects rendering variant:`, variant);

  const projects = Array.isArray(data) ? data : [{
    name: typeof data === 'string' ? data : data.name || "Project",
    description: data.description || "",
    technologies: data.technologies || data.stack || []
  }];

  const getStack = (techs: any) => {
    if (!techs) return [];
    if (typeof techs === 'string') return techs.split(',').map(t => t.trim());
    return techs;
  };

  switch (variant) {
    case "cards":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-4 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Projects
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.map((proj: any, i: number) => (
              <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-base font-bold mb-1" style={{ color: theme.textPrimary }}>{proj.name}</h3>
                <p className="text-sm opacity-80 mb-3 leading-relaxed">{proj.description}</p>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {getStack(proj.technologies).map((tech: string, j: number) => (
                    <span key={j} className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium" 
                          style={{ backgroundColor: theme.accentColor + '15', color: theme.accentColor }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "compact":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj: any, i: number) => (
              <div key={i} className="text-sm">
                <span className="font-bold mr-2 text-slate-900 dark:text-white">{proj.name}</span>
                <span className="opacity-80 leading-relaxed">{proj.description}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "list":
    default:
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Projects
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-3">
            {projects.map((proj: any, i: number) => (
              <li key={i} className="text-sm">
                <div className="font-bold flex items-center gap-2 text-[15px] mb-0.5 text-slate-900 dark:text-white">
                  {proj.name}
                  {getStack(proj.technologies).length > 0 && (
                    <span className="font-normal text-xs opacity-70 italic">
                      — {getStack(proj.technologies).join(", ")}
                    </span>
                  )}
                </div>
                <div className="opacity-80 leading-relaxed">{proj.description}</div>
              </li>
            ))}
          </ul>
        </div>
      );
  }
}
