import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface RecommendationChipProps {
  text: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive";
}

export default function RecommendationChip({ text, icon: Icon, variant = "default" }: RecommendationChipProps) {
  const getVariantClass = () => {
    switch (variant) {
      case "success":
        return "bg-chart-5/20 text-chart-5 border-chart-5/30";
      case "warning":
        return "bg-chart-4/20 text-chart-4 border-chart-4/30";
      case "destructive":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  return (
    <Badge 
      className={`gap-2 px-4 py-2 border ${getVariantClass()}`}
      data-testid="badge-recommendation"
    >
      <Icon className="w-4 h-4" />
      <span>{text}</span>
    </Badge>
  );
}
