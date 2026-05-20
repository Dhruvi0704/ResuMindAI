import React from "react";

export default function CertificationsSection({ data, variant, theme }: any) {
  if (!data || data.length === 0) return null;
  console.log(`📦 certifications rendering variant:`, variant);

  const certs = Array.isArray(data) ? data : [{
    name: typeof data === 'string' ? data : data.name || "Certification",
    issuer: data.issuer || "",
    year: data.year || ""
  }];

  switch (variant) {
    case "badges":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-4 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Certifications
          </h2>
          <div className="flex flex-wrap gap-3">
            {certs.map((cert: any, i: number) => (
              <div key={i} className="flex items-center gap-2 border px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accentColor }}></span>
                <span className="text-sm font-semibold">{cert.name}</span>
                {cert.year && <span className="text-xs opacity-60 ml-1">{cert.year}</span>}
              </div>
            ))}
          </div>
        </div>
      );
    case "compact":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Certifications
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {certs.map((cert: any, i: number) => (
              <span key={i} className="text-sm opacity-90 flex items-center gap-1.5">
                <span className="opacity-50" style={{ color: theme.accentColor }}>▹</span>
                {cert.name} {cert.year && `(${cert.year})`}
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
            Certifications
          </h2>
          <div className="space-y-2">
            {certs.map((cert: any, i: number) => (
              <div key={i} className="flex justify-between items-baseline">
                <div className="text-[15px] font-semibold text-slate-800 dark:text-slate-200">
                  {cert.name}
                  {cert.issuer && <span className="text-sm font-normal opacity-70 ml-2 border-l pl-2 border-slate-300 dark:border-slate-600">{cert.issuer}</span>}
                </div>
                <span className="text-xs font-medium" style={{ color: theme.accentColor }}>{cert.year}</span>
              </div>
            ))}
          </div>
        </div>
      );
  }
}
