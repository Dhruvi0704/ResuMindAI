import React from "react";
import EditableField from "../EditableField";
import EditableSection from "../EditableSection";
import { useResume } from "@/contexts/ResumeContext";

export default function HeaderSection({ data, variant, theme }: any) {
  const { dispatch } = useResume();
  if (!data) return null;

  return (
    <EditableSection sectionName="Header">
      <div 
        className={`mb-6 flex flex-col ${
          variant === "centered" ? "items-center text-center" : 
          variant === "left" ? "items-start text-left" : 
          "items-center text-center"
        }`}
      >
        <h1 
          className={`text-3xl sm:text-4xl font-bold tracking-tight mb-2 ${theme.fontHeading}`}
          style={{ color: theme.textPrimary }}
        >
          <EditableField
            value={data.name || ''}
            field="name"
            sectionId="personal"
            variant="heading"
            placeholder="Your Full Name"
            onUpdate={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { section: 'personal', field: 'name', value: val } })}
          />
        </h1>
        
        <h2 
          className="text-lg sm:text-xl font-medium mb-4"
          style={{ color: theme.accentColor }}
        >
          <EditableField
            value={data.title || data.jobTitle || ''}
            field="jobTitle"
            sectionId="personal"
            variant="single"
            placeholder="Your Job Title"
            onUpdate={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { section: 'personal', field: 'jobTitle', value: val } })}
          />
        </h2>
        
        <div 
          className={`flex flex-wrap gap-x-4 gap-y-2 text-sm max-w-2xl ${
            variant === 'centered' ? 'justify-center' : 'justify-start'
          }`}
          style={{ color: theme.textSecondary }}
        >
          <div className="flex items-center gap-1.5">
            <EditableField
              value={data.email || ''}
              field="email"
              sectionId="personal"
              variant="single"
              placeholder="Email"
              onUpdate={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { section: 'personal', field: 'email', value: val } })}
            />
          </div>
          <span className="opacity-50">•</span>
          <div className="flex items-center gap-1.5">
            <EditableField
              value={data.phone || ''}
              field="phone"
              sectionId="personal"
              variant="single"
              placeholder="Phone"
              onUpdate={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { section: 'personal', field: 'phone', value: val } })}
            />
          </div>
          <span className="opacity-50">•</span>
          <div className="flex items-center gap-1.5">
            <EditableField
              value={data.location || ''}
              field="location"
              sectionId="personal"
              variant="single"
              placeholder="Location"
              onUpdate={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { section: 'personal', field: 'location', value: val } })}
            />
          </div>
          
          <div className="flex items-center gap-1.5">
              <span className="opacity-50">•</span>
              <EditableField
                value={data.linkedin || data.linkedinProfile || ''}
                field="linkedinProfile"
                sectionId="socialLinks"
                variant="single"
                placeholder="LinkedIn"
                onUpdate={(val) => dispatch({ type: 'UPDATE_FIELD', payload: { section: 'socialLinks', field: 'linkedinProfile', value: val } })}
              />
          </div>
        </div>
      </div>
    </EditableSection>
  );
}
