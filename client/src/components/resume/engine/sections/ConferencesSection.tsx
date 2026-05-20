import React from "react";

export default function ConferencesSection({ data, variant, theme }: any) {
  if (!data || data.length === 0) return null;
  console.log(`📦 conferences rendering variant:`, variant);

  const conferences = Array.isArray(data) ? data : [{
    name: typeof data === 'string' ? data : data.name || data.title || "Conference",
    role: data.role || data.type || "Attendee",
    year: data.year || ""
  }];

  switch (variant) {
    case "compact":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Conferences
          </h2>
          <div className="text-sm leading-relaxed opacity-90">
            {conferences.map((conf: any, i: number) => (
              <span key={i}>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{conf.name}</span>
                {conf.year && <span className="opacity-70 mx-1">({conf.year})</span>}
                {i < conferences.length - 1 && <span className="mx-2 opacity-50">•</span>}
              </span>
            ))}
          </div>
        </div>
      );
    case "default":
    default:
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Conferences & Presentations
          </h2>
          <ul className="space-y-2 list-none m-0 p-0">
            {conferences.map((conf: any, i: number) => (
              <li key={i} className="flex items-start text-sm">
                <span className="mr-2 opacity-50 mt-1 text-[10px]">▶</span>
                <div>
                  <div className="font-semibold" style={{ color: theme.textPrimary }}>{conf.name} {conf.year && <span className="font-normal opacity-60 ml-1">({conf.year})</span>}</div>
                  {conf.role && <div className="opacity-80 italic mt-0.5" style={{ color: theme.accentColor }}>{conf.role}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
  }
}
