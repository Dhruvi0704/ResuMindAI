import React from "react";

export default function GrantsSection({ data, variant, theme }: any) {
  if (!data || data.length === 0) return null;
  console.log(`📦 grants rendering variant:`, variant);

  const grants = Array.isArray(data) ? data : [{
    name: typeof data === 'string' ? data : data.name || data.title || "Grant",
    issuer: data.issuer || data.agency || "",
    amount: data.amount || "",
    year: data.year || ""
  }];

  switch (variant) {
    case "compact":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Grants & Fellowships
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-1">
            {grants.map((grant: any, i: number) => (
              <li key={i} className="text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{grant.name}</span>
                {grant.issuer && <span className="opacity-80 mx-1">— {grant.issuer}</span>}
                {grant.amount && <span className="font-medium mr-1" style={{ color: theme.accentColor }}>({grant.amount})</span>}
                {grant.year && <span className="opacity-70 font-medium">[{grant.year}]</span>}
              </li>
            ))}
          </ul>
        </div>
      );
    case "default":
    default:
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-4 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Grants
          </h2>
          <div className="space-y-4">
            {grants.map((grant: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-[15px] font-bold" style={{ color: theme.textPrimary }}>{grant.name}</h3>
                  <div className="text-sm font-medium opacity-90 text-right">
                    {grant.amount && <span className="mr-3 p-1 rounded bg-slate-100 dark:bg-slate-800" style={{ color: theme.accentColor }}>{grant.amount}</span>}
                    <span className="opacity-80">{grant.year}</span>
                  </div>
                </div>
                {grant.issuer && <div className="text-sm opacity-90">{grant.issuer}</div>}
              </div>
            ))}
          </div>
        </div>
      );
  }
}
