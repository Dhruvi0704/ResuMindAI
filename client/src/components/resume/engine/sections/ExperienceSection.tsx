import React from "react";
import EditableField from "../EditableField";
import { useResume } from "@/contexts/ResumeContext";

export default function ExperienceSection({ data, variant, theme, isPrinting }: any) {
  const { dispatch } = useResume();

  // Handle data mapping from mock vs real shape intelligently
  const experienceData = Array.isArray(data) ? data : (data?.experience || []);

  return (
    <div style={{ marginBottom: '20px' }} className="group/section relative w-full">
      {/* Section header — flex, no overlap */}
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
          EXPERIENCE
        </h2>
        {!isPrinting && (
          <button 
            data-edit-button
            onClick={() => dispatch({ 
              type: 'ADD_EXPERIENCE',
              payload: {
                id: crypto.randomUUID(),
                role: 'New Role',
                company: 'Company Name',
                startDate: '2024',
                endDate: 'Present',
                bullets: ['Describe your achievement here']
              }
            })}
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
            + Add Experience
          </button>
        )}
      </div>

      {/* Experience entries */}
      {(!experienceData || experienceData.length === 0) && (
        <p style={{ 
          color: theme.textSecondary, 
          fontSize: '12px',
          fontStyle: 'italic' 
        }}>
          No experience added yet. Click "+ Add Experience"
        </p>
      )}

      {experienceData.map((exp: any, index: number) => (
        <div key={exp.id || index} style={{ 
          marginBottom: '16px',
          position: 'relative',
          padding: !isPrinting ? '4px' : '0',
          borderRadius: '4px',
          border: !isPrinting ? '1px dashed transparent' : 'none',
          transition: 'border-color 0.15s'
        }}
        onMouseEnter={e => {
          if (!isPrinting) {
            e.currentTarget.style.borderColor = theme.accentColor + '40';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'transparent';
        }}
        className="group/item"
        >
          
          {/* Delete entry button */}
          {!isPrinting && (
            <button
              onClick={() => dispatch({
                type: 'DELETE_EXPERIENCE',
                index
              })}
              style={{
                position: 'absolute', top: 4, right: 4,
                background: '#ff4444', color: 'white',
                border: 'none', borderRadius: '3px',
                width: '18px', height: '18px',
                fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', lineHeight: 1,
                zIndex: 10
              }}
              className="opacity-0 group-hover/item:opacity-100 transition-opacity"
              title="Delete Experience"
            >
              ×
            </button>
          )}

          {/* Role - editable */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '2px'
          }}>
            <EditableField
              value={exp.role || exp.title || ''}
              field="role"
              sectionId="experience"
              variant="single"
              placeholder="Job Title"
              className="font-bold text-[15px] w-[60%]"
              style={{ color: theme.textPrimary }}
              onUpdate={(val) => dispatch({
                type: 'UPDATE_EXPERIENCE',
                index,
                field: 'role',
                value: val
              })}
            />
            <div style={{ 
              display: 'flex', gap: '4px',
              fontSize: '12px',
              fontWeight: 500,
              color: theme.textSecondary,
              minWidth: '30%',
              justifyContent: 'flex-end'
            }}>
              <EditableField
                value={
                  exp.startDate 
                    ? `${exp.startDate} - ${exp.endDate || 'Present'}`
                    : ''
                }
                field="period"
                sectionId="experience"
                variant="single"
                placeholder="2020 - Present"
                onUpdate={(val) => {
                  const [start, end] = val.split(/\s*-\s*/);
                  dispatch({ type: 'UPDATE_EXPERIENCE', index, field: 'startDate', value: start?.trim() || '' });
                  dispatch({ type: 'UPDATE_EXPERIENCE', index, field: 'endDate', value: end?.trim() || 'Present' });
                }}
              />
            </div>
          </div>

          {/* Company - editable */}
          <div style={{ marginBottom: '6px' }}>
             <EditableField
              value={exp.company || ''}
              field="company"
              sectionId="experience"
              variant="single"
              placeholder="Company Name"
              style={{ color: theme.accentColor, fontSize: '13px', fontWeight: 500 }}
              onUpdate={(val) => dispatch({
                type: 'UPDATE_EXPERIENCE',
                index, field: 'company', value: val
              })}
            />
          </div>

          {/* Bullets - editable */}
          <div style={{ marginTop: '6px' }}>
            {exp.bullets?.map((bullet: string, bulletIndex: number) => (
              <div key={bulletIndex} style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                gap: '6px',
                marginBottom: '4px'
              }} className="group/bullet">
                <span style={{ 
                  color: theme.accentColor,
                  marginTop: '1px',
                  fontSize: '14px',
                  flexShrink: 0 
                }}>•</span>
                <div style={{ flex: 1, color: theme.textSecondary, fontSize: '13px', lineHeight: 1.5 }}>
                   <EditableField
                    value={bullet}
                    field={`bullet_\${bulletIndex}`}
                    sectionId="experience"
                    variant="multiline"
                    placeholder="Describe achievement..."
                    onUpdate={(val) => dispatch({
                      type: 'UPDATE_EXPERIENCE_BULLET',
                      index,
                      bulletIndex,
                      value: val
                    })}
                  />
                </div>
                {!isPrinting && (
                  <button
                    onClick={() => dispatch({
                      type: 'DELETE_EXPERIENCE_BULLET',
                      index, bulletIndex
                    })}
                    style={{
                      color: '#ff4444', background: 'none',
                      border: 'none', cursor: 'pointer',
                      fontSize: '16px', lineHeight: 1,
                      padding: '0 2px', flexShrink: 0
                    }}
                    className="opacity-0 group-hover/bullet:opacity-100 transition-opacity hover:scale-110"
                    title="Remove Bullet"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            {/* Fallback for old schema where responsibilities was a flat string */}
            {!exp.bullets && exp.description && (
               <div style={{ color: theme.textSecondary, fontSize: '13px', lineHeight: 1.5 }}>{exp.description}</div>
            )}
            
            {/* Add bullet button */}
            {!isPrinting && (
              <button
                onClick={() => dispatch({
                  type: 'ADD_EXPERIENCE_BULLET',
                  index
                })}
                style={{
                  fontSize: '11px',
                  color: theme.accentColor,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                  marginLeft: '14px',
                  fontWeight: 500,
                  opacity: 0.8
                }}
                className="hover:opacity-100 hover:underline transition-all"
              >
                + Add bullet point
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
