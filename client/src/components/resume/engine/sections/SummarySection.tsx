import React from "react";
import EditableField from "../EditableField";
import EditableSection from "../EditableSection";
import { useResume } from "@/contexts/ResumeContext";

export default function SummarySection({ data, variant, theme }: any) {
  const { dispatch } = useResume();
  if (!data) return null;

  const textNode = typeof data === 'string' ? data : (data.text || data.summary || data.description || String(data));
  const keywords = (typeof data !== 'string' && data.keywords) ? data.keywords : [];

  return (
    <EditableSection sectionName="Summary">
      <div className="mb-6">
        <h2 className={`text-lg font-bold uppercase mb-3 ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
          Executive Summary
        </h2>
        <div className="text-[15px] leading-relaxed mb-3" style={{ color: theme.textPrimary }}>
          <EditableField
            value={textNode || ''}
            field="summary"
            sectionId="personal"
            variant="multiline"
            placeholder="Detailed professional summary..."
            onUpdate={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { section: 'personal', field: 'summary', value: val } })}
          />
        </div>
      </div>
    </EditableSection>
  );
}
