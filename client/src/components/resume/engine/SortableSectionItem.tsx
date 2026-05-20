import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SectionConfig {
  id: string;
  name?: string;
  visible: boolean;
  locked?: boolean;
  order: number;
  variant: string;
  variantOptions: string[];
}

interface Props {
  section: SectionConfig;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onVariantChange: (id: string, variant: string) => void;
}

export function SortableSectionItem({ section, onVisibilityChange, onVariantChange }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: section.locked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : "auto",
  };

  const sectionName = section.name || section.id.charAt(0).toUpperCase() + section.id.slice(1);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col gap-2 rounded-lg border p-3 bg-[#1e1e38] border-white/10 ${isDragging ? 'shadow-2xl border-[#6C63FF] opacity-90' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div 
          className={`cursor-grab active:cursor-grabbing p-1 ${section.locked ? 'opacity-20 pointer-events-none' : 'text-slate-500 hover:text-white'}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </div>

        {/* Toggle */}
        <Switch 
          checked={section.visible} 
          disabled={section.locked}
          onCheckedChange={(checked) => onVisibilityChange(section.id, checked)}
          className="data-[state=checked]:bg-[#6C63FF]"
        />

        {/* Name */}
        <span className={`text-sm font-medium ${!section.visible ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
          {sectionName}
          {section.locked && <span className="ml-2 text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded-full bg-black/20">Locked</span>}
        </span>
      </div>

      {/* Variant Selector (Only show if visible) */}
      {section.visible && section.variantOptions && section.variantOptions.length > 0 && (
        <div className="pl-10 pr-2">
          <Select 
            value={section.variant} 
            onValueChange={(val) => {
              console.log(`🔄 Variant changed: ${section.id} → ${val}`);
              onVariantChange(section.id, val);
            }}
          >
            <SelectTrigger className="h-7 text-xs bg-black/20 border-white/10 text-slate-300">
              <SelectValue placeholder="Variant" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 text-slate-200">
              {section.variantOptions.map(opt => (
                <SelectItem key={opt} value={opt} className="text-xs hover:bg-white/10 focus:bg-white/10">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
