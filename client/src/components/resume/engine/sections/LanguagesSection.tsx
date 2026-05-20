import React from "react";

export default function LanguagesSection({ data, variant, theme }: any) {
  if (!data || data.length === 0) return null;
  console.log(`📦 languages rendering variant:`, variant);

  const languages = Array.isArray(data) ? data : (typeof data === 'string' ? data.split(',').map(s=>({name: s.trim()})) : [data]);

  switch (variant) {
    case "flags":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-4 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Languages
          </h2>
          <div className="flex flex-wrap gap-4">
            {languages.map((lang: any, i: number) => {
              const name = typeof lang === 'string' ? lang : lang.name;
              const level = lang.level || lang.proficiency || '';
              // Simple emoji mapping heuristic
              let emoji = "🌐";
              if (name.toLowerCase().includes('english') || name.toLowerCase().includes('en')) emoji = "🇺🇸";
              if (name.toLowerCase().includes('spanish') || name.toLowerCase().includes('es')) emoji = "🇪🇸";
              if (name.toLowerCase().includes('french') || name.toLowerCase().includes('fr')) emoji = "🇫🇷";
              if (name.toLowerCase().includes('german') || name.toLowerCase().includes('de')) emoji = "🇩🇪";
              if (name.toLowerCase().includes('chinese') || name.toLowerCase().includes('zh')) emoji = "🇨🇳";
              
              return (
                <div key={i} className="flex items-center gap-2 border px-3 py-1.5 rounded bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
                  <span className="text-xl">{emoji}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight">{name}</span>
                    {level && <span className="text-[10px] uppercase font-medium opacity-60 leading-tight tracking-wider" style={{ color: theme.accentColor }}>{level}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    case "pills":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Languages
          </h2>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang: any, i: number) => {
              const name = typeof lang === 'string' ? lang : lang.name;
              const level = lang.level || lang.proficiency || '';
              return (
                <span key={i} className="px-3 py-1.5 text-sm font-medium rounded-full text-white flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: theme.accentColor }}>
                  {name}
                  {level && <span className="bg-black/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{level}</span>}
                </span>
              );
            })}
          </div>
        </div>
      );
    case "bars":
    default:
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-4 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Languages
          </h2>
          <div className="space-y-3">
            {languages.map((lang: any, i: number) => {
              const name = typeof lang === 'string' ? lang : lang.name;
              const levelStr = lang.level || lang.proficiency || '';
              let numLevel = 80;
              if (levelStr.toLowerCase().includes('native') || levelStr.toLowerCase().includes('fluent')) numLevel = 100;
              if (levelStr.toLowerCase().includes('intermediate')) numLevel = 60;
              if (levelStr.toLowerCase().includes('basic')) numLevel = 30;

              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{name}</span>
                    <span className="opacity-60">{levelStr || 'Proficient'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${numLevel}%`, backgroundColor: theme.accentColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
  }
}
