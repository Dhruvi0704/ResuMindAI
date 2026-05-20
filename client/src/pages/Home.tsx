import { FileText, Search, FilePenLine, Video } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight transition-colors" data-testid="text-hero-title">
              Build Your Dream Career
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered resume and CV tools designed for Gen Z professionals. Get hired faster with ATS-optimized documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              title="Resume Generator"
              description="Create professional ATS-friendly resumes in minutes with our AI-powered generator and stunning templates"
              icon={FileText}
              href="/resume-generator"
              gradient="bg-gradient-to-br from-primary/10 to-accent/5 backdrop-blur-sm"
            />
            <FeatureCard
              title="Resume Screening"
              description="Get instant ATS score analysis and personalized recommendations to improve your resume"
              icon={Search}
              href="/resume-screening"
              gradient="bg-gradient-to-br from-primary/5 to-accent/10 backdrop-blur-sm"
            />
            <FeatureCard
              title="CV Generator"
              description="Build comprehensive CVs for academic and research positions with expert templates"
              icon={FilePenLine}
              href="/cv-generator"
              gradient="bg-gradient-to-br from-accent/10 to-primary/5 backdrop-blur-sm"
            />
            <FeatureCard
              title="Mock Interview"
              description="Practice with AI-driven mock interviews tailored to your job role and get instant feedback"
              icon={Video}
              href="/mock-interview"
              gradient="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm"
            />
          </div>
        </div>
      </main>

          </div>
  );
}
