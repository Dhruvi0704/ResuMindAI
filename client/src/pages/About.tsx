import { Card } from "@/components/ui/card";
import { Target, Users, Zap } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
            
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">About ResuMind AI</h1>

          <div className="max-w-3xl mb-12">
            <p className="text-lg text-muted-foreground mb-4">
              ResuMind AI is your intelligent career companion, designed specifically for Gen Z professionals navigating the modern job market. We combine cutting-edge AI technology with user-friendly design to help you create resumes and CVs that get noticed.
            </p>
            <p className="text-lg text-muted-foreground">
              Our mission is to democratize access to professional resume tools, ensuring everyone has the opportunity to present their best self to potential employers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover-elevate transition-all">
              <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
              <p className="text-muted-foreground">
                To empower job seekers with AI-powered tools that make career advancement accessible to everyone.
              </p>
            </Card>

            <Card className="p-6 hover-elevate transition-all">
              <div className="p-3 rounded-xl bg-chart-2/10 w-fit mb-4">
                <Zap className="w-8 h-8 text-chart-2" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-muted-foreground">
                We leverage the latest AI technology to provide instant feedback and optimization for your documents.
              </p>
            </Card>

            <Card className="p-6 hover-elevate transition-all">
              <div className="p-3 rounded-xl bg-chart-3/10 w-fit mb-4">
                <Users className="w-8 h-8 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-muted-foreground">
                Join thousands of successful job seekers who've landed their dream roles with our platform.
              </p>
            </Card>
          </div>
        </div>
      </main>

          </div>
  );
}
