import RecommendationChip from "../RecommendationChip";
import { Lightbulb } from "lucide-react";

export default function RecommendationChipExample() {
  return (
    <div className="p-4 flex gap-2 flex-wrap">
      <RecommendationChip text="Add more technical skills" icon={Lightbulb} variant="default" />
      <RecommendationChip text="Great job description" icon={Lightbulb} variant="success" />
    </div>
  );
}
