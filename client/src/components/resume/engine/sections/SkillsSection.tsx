import React from "react";
import EditableField from "../EditableField";
import EditableSection from "../EditableSection";
import { useResume } from "@/contexts/ResumeContext";
import { Plus, X } from "lucide-react";

export default function SkillsSection({ data, variant, theme }: any) {
  const { dispatch } = useResume();
  if (!data || !Array.isArray(data)) return null;

  const handleAddSkill = () => {
    dispatch({
      type: 'ADD_SKILL',
      payload: { id: Date.now().toString(), name: 'New Skill', level: 'intermediate', category: 'soft' }
    });
  };

  const handleUpdate = (id: string, val: string) => {
    dispatch({ type: 'UPDATE_SKILLS', payload: data.map((s: any) => s.id === id ? { ...s, name: val } : s) });
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_SKILL', payload: id });
  };

  return (
    <EditableSection sectionName="Skills">
      <div className="mb-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-bold uppercase ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Core Competencies
          </h2>
          <button 
            data-edit-button 
            onClick={handleAddSkill} 
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-black/10 hover:bg-black/20 text-black/60 dark:bg-white/10 dark:text-white/70"
          >
            <Plus className="w-3 h-3" /> Add Skill
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full">
          {data.map((skill: any, i: number) => (
            <div 
              key={skill.id || i} 
              className="relative group flex items-center px-3 py-1.5 rounded text-sm font-medium border transition-colors shadow-sm w-max"
              style={{ 
                backgroundColor: theme.accentColor + '15',
                color: theme.textPrimary,
                borderColor: theme.accentColor + '30'
              }}
            >
              <EditableField
                value={skill.name || skill}
                field="name"
                sectionId="skills"
                variant="single"
                onUpdate={(val) => handleUpdate(skill.id, val)}
              />
              <button 
                data-delete-button
                onClick={() => handleDelete(skill.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-sm italic" style={{ color: theme.textSecondary }}>No skills added yet.</p>
          )}
        </div>
      </div>
    </EditableSection>
  );
}
