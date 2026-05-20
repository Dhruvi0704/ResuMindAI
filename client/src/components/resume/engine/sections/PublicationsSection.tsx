import React from "react";
import EditableField from "../EditableField";
import EditableSection from "../EditableSection";
import { useResume } from "@/contexts/ResumeContext";
import { Plus, X } from "lucide-react";

export default function PublicationsSection({ data, variant, theme }: any) {
  const { dispatch } = useResume();
  if (!data) return null;

  const pubs = Array.isArray(data) ? data : [];

  const handleUpdate = (index: number, field: string, val: string) => {
    const updatedArray = [...pubs];
    if (typeof updatedArray[index] === 'string') {
      updatedArray[index] = val;
    } else {
      updatedArray[index] = { ...updatedArray[index], [field]: val };
    }
    // We update the entire array root to circumvent array-index nesting depths in simple Reducers
    // Note: Assuming `publications` exists at the root of your ResumeData type based on schema
    dispatch({ type: 'UPDATE_FIELD', payload: { section: 'publications', field: 'root', value: updatedArray } });
  };

  const handleAdd = () => {
    const updatedArray = [...pubs, { title: 'New Publication', citation: 'Citation text...', year: '2025' }];
    dispatch({ type: 'UPDATE_FIELD', payload: { section: 'publications', field: 'root', value: updatedArray } });
  };

  const handleDelete = (index: number) => {
    const updatedArray = pubs.filter((_, i) => i !== index);
    dispatch({ type: 'UPDATE_FIELD', payload: { section: 'publications', field: 'root', value: updatedArray } });
  };

  return (
    <EditableSection sectionName="Publications">
      <div className="mb-6 w-full group/section">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-bold uppercase ${theme.fontHeading}`} style={{ color: theme.accentColor }}>
            Publications
          </h2>
          <button 
            data-edit-button 
            onClick={handleAdd} 
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-black/10 hover:bg-black/20 text-black/60 dark:bg-white/10 dark:text-white/70"
          >
            <Plus className="w-3 h-3" /> Add Publication
          </button>
        </div>
        
        <div className="space-y-4">
          {pubs.map((pub: any, i: number) => (
            <div key={i} className="relative group/item">
              <button 
                data-delete-button
                onClick={() => handleDelete(i)}
                className="absolute -right-3 -top-3 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 opacity-0 group-hover/item:opacity-100 transition-opacity z-10"
                title="Delete Publication"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-[15px] font-bold max-w-[90%]" style={{ color: theme.textPrimary }}>
                <EditableField
                  value={typeof pub === 'string' ? pub : pub.title || ''}
                  field="title"
                  sectionId="publications"
                  variant="single"
                  placeholder="Publication Title"
                  onUpdate={(val) => handleUpdate(i, 'title', val)}
                />
              </h3>
              
              <div className="text-sm opacity-80 leading-relaxed border-l-2 pl-3 mt-1" style={{ borderColor: theme.accentColor + '50' }}>
                 <EditableField
                  value={pub.citation || pub.abstract || ''}
                  field="citation"
                  sectionId="publications"
                  variant="multiline"
                  placeholder="Authors, Journal name, description, abstract..."
                  onUpdate={(val) => handleUpdate(i, 'citation', val)}
                 />
              </div>
            </div>
          ))}
          {pubs.length === 0 && (
             <p className="text-sm italic" style={{ color: theme.textSecondary }}>No publications added yet.</p>
          )}
        </div>
      </div>
    </EditableSection>
  );
}
