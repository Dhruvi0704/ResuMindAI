import React from "react";

export default function ReferencesSection({ data, variant, theme }: any) {
  if (variant === "hidden") {
    console.log(`📦 references rendering variant: hidden`);
    return null;
  }
  
  if (!data || data.length === 0) {
    // Return standard "Available upon request" block if visible but empty data
    return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            References
          </h2>
          <p className="text-sm italic opacity-80" style={{ color: theme.textPrimary }}>
            References available upon request.
          </p>
        </div>
    );
  }

  console.log(`📦 references rendering variant:`, variant);
  const references = Array.isArray(data) ? data : [{
    name: typeof data === 'string' ? data : data.name || "Reference",
    title: data.title || "",
    company: data.company || "",
    contact: data.contact || data.email || data.phone || ""
  }];

  return (
    <div className="mb-6">
      <h2 className={`text-lg font-bold uppercase mb-4 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
        References
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        {references.map((ref: any, i: number) => (
          <div key={i} className="text-sm">
            <h3 className="font-bold text-[15px] mb-0.5" style={{ color: theme.textPrimary }}>{ref.name}</h3>
            <div className="font-medium opacity-90" style={{ color: theme.accentColor }}>{ref.title}</div>
            <div className="opacity-80">{ref.company}</div>
            {ref.contact && <div className="opacity-70 mt-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 p-1 px-2 inline-block rounded">{ref.contact}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
