import React from "react";

export default function AwardsSection({ data, variant, theme }: any) {
  if (!data || data.length === 0) return null;
  console.log(`📦 awards rendering variant:`, variant);

  const awards = Array.isArray(data) ? data : [typeof data === 'string' ? data : data.title];

  switch (variant) {
    case "compact":
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Awards
          </h2>
          <div className="opacity-90 text-sm leading-relaxed">
            {awards.map((award: any, i: number) => {
               const title = typeof award === 'string' ? award : award.title || 'Award';
               return (
                 <span key={i}>
                   {title}
                   {i < awards.length - 1 && <span className="mx-2 opacity-40">|</span>}
                 </span>
               )
            })}
          </div>
        </div>
      );
    case "default":
    default:
      return (
        <div className="mb-6">
          <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Awards & Honors
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-1.5 opacity-90 text-sm">
            {awards.map((award: any, i: number) => {
               const title = typeof award === 'string' ? award : award.title || 'Award';
               const year = award.year || '';
               return (
                  <li key={i}>
                    <strong>{title}</strong> {year && <span className="opacity-70 mx-1">({year})</span>}
                  </li>
               )
            })}
          </ul>
        </div>
      );
  }
}
