import FeatureCard from "../FeatureCard";
import { FileText } from "lucide-react";

export default function FeatureCardExample() {
  return (
    <div className="p-4">
      <FeatureCard
        title="Resume Generator"
        description="Create professional ATS-friendly resumes in minutes with our AI-powered generator"
        icon={FileText}
        href="/resume-generator"
        gradient="bg-gradient-to-br from-primary/10 to-chart-2/10"
      />
    </div>
  );
}
