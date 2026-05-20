import React from "react";
import EditableField from "../EditableField";
import { useResume } from "@/contexts/ResumeContext";

export default function EducationSection({ data, variant, theme, isPrinting }: any) {
  const { dispatch } = useResume();

  // Safeguard array map
  const educationData = Array.isArray(data) ? data : (data?.education || []);

  return (
    <div style={{ marginBottom: '20px' }}>
      
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `2px solid \${theme.accentColor}`,
        paddingBottom: '4px',
        marginBottom: '12px'
      }}>
        <h2 style={{ 
          color: theme.accentColor, fontSize: '13px',
          fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', margin: 0 
        }}>
          EDUCATION
        </h2>
        {!isPrinting && (
          <button 
           onClick={() => dispatch({ type: 'ADD_EDUCATION' })}
           style={{
              fontSize: '11px',
              color: theme.accentColor,
              border: `1px solid \${theme.accentColor}`,
              borderRadius: '4px',
              padding: '3px 8px',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
            className="hover:bg-slate-500/10 transition-colors"
          >
            + Add Education
          </button>
        )}
      </div>

      {(!educationData || educationData.length === 0) && (
        <p style={{ 
          color: theme.textSecondary,
          fontSize: '12px',
          fontStyle: 'italic'
        }}>
          No education added yet. Click "+ Add Education"
        </p>
      )}

      {educationData.map((edu: any, index: number) => (
        <div key={edu.id || index} style={{ 
          marginBottom: '14px',
          position: 'relative',
          padding: !isPrinting ? '4px' : '0',
          borderRadius: '4px',
          border: !isPrinting ? '1px dashed transparent' : 'none',
          transition: 'border-color 0.15s'
        }}
        onMouseEnter={e => {
          if (!isPrinting) e.currentTarget.style.borderColor = theme.accentColor + '40';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'transparent';
        }}
        className="group/item"
        >
          
          {!isPrinting && (
            <button
              onClick={() => dispatch({
                type: 'DELETE_EDUCATION', index
              })}
              style={{
                position: 'absolute', top: 4, right: 4,
                background: '#ff4444', color: 'white',
                border: 'none', borderRadius: '3px',
                width: '18px', height: '18px',
                fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', lineHeight: 1, zIndex: 10
              }}
              className="opacity-0 group-hover/item:opacity-100 transition-opacity"
              title="Delete Education"
            >
              ×
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <EditableField
              value={edu.degree || edu.title || edu.qualification || ''}
              field="degree"
              sectionId="education"
              variant="single"
              placeholder="Degree / Qualification"
              className="font-bold text-[14px]"
              style={{ color: theme.textPrimary }}
              onUpdate={(val) => dispatch({
                type: 'UPDATE_EDUCATION',
                index, field: 'degree', value: val
              })}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ width: '65%' }}>
                 <EditableField
                  value={edu.institution || edu.school || edu.university || ''}
                  field="institution"
                  sectionId="education"
                  variant="single"
                  placeholder="University / Institution"
                  style={{ 
                    color: theme.accentColor,
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                  onUpdate={(val) => dispatch({
                    type: 'UPDATE_EDUCATION',
                    index, field: 'institution', value: val
                  })}
                 />
              </div>
              <div style={{ width: '30%', textAlign: 'right' }}>
                 <EditableField
                  value={edu.year || edu.graduationYear || edu.endYear || edu.endDate || ''}
                  field="year"
                  sectionId="education"
                  variant="single"
                  placeholder="Year"
                  style={{ 
                    color: theme.textSecondary,
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                  onUpdate={(val) => dispatch({
                    type: 'UPDATE_EDUCATION',
                    index, field: 'year', value: val
                  })}
                 />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
