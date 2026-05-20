import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, User } from "lucide-react";

interface VisualTemplatePreviewProps {
  id: string;
  name: string;
  isPremium: boolean;
  variant: "professional" | "modern-photo" | "executive" | "creative-photo" | "minimal" | "two-column" | "sidebar-photo" | "elegant";
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

export default function VisualTemplatePreview({ id, name, isPremium, variant, onSelect, isSelected }: VisualTemplatePreviewProps) {
  const renderProfessionalTemplate = () => (
    <div className="w-full h-full bg-white text-black p-4 text-[6px] leading-tight">
      <div className="text-center mb-2 pb-2 border-b border-gray-200">
        <h1 className="font-bold text-[9px] mb-0.5">ADITYA GUPTA</h1>
        <p className="text-[5px] text-gray-600 mb-1">Software Developer</p>
        <div className="flex justify-center gap-2 text-[4.5px] text-gray-600">
          <span>📞 +91-7510690313</span>
          <span>✉ aditya@gmail.com</span>
          <span>🔗 linkedin.com/in/aditya</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div>
          <h2 className="font-bold text-[6.5px] mb-0.5">SUMMARY</h2>
          <p className="text-[5px] text-gray-700">Aspiring Software Developer skilled in Python, C++, Java...</p>
        </div>
        <div>
          <h2 className="font-bold text-[6.5px] mb-0.5">EDUCATION</h2>
          <p className="text-[5px] font-semibold">ABES Engineering College</p>
          <p className="text-[4.5px] text-gray-600">Bachelor of Technology • CGPA: 7.92/10</p>
        </div>
        <div>
          <h2 className="font-bold text-[6.5px] mb-0.5">EXPERIENCE</h2>
          <p className="text-[5px] font-semibold">Software Development Intern</p>
          <p className="text-[4.5px] text-gray-600">XYZ Corp • Jan 2024 - Present</p>
        </div>
        <div>
          <h2 className="font-bold text-[6.5px] mb-0.5">TECHNICAL SKILLS</h2>
          <p className="text-[4.5px] text-gray-700">Python, C++, Java, React, Node.js, MongoDB</p>
        </div>
      </div>
    </div>
  );

  const renderModernPhotoTemplate = () => (
    <div className="w-full h-full bg-white text-black p-4 text-[6px] leading-tight">
      <div className="flex items-start gap-3 mb-2 pb-2 border-b-2 border-gray-800">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-[10px]">JOHN ANDERSON</h1>
          <p className="text-[6px] text-gray-600 mb-0.5">Senior Product Manager</p>
          <div className="text-[4.5px] text-gray-600">
            <span>john@email.com • +1-234-567-8900</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <h2 className="font-bold text-[6px] text-gray-800">EXPERIENCE</h2>
          <div className="text-[4.5px]">
            <p className="font-semibold">Senior PM</p>
            <p className="text-gray-600">Tech Co • 2022-Now</p>
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="font-bold text-[6px] text-gray-800">SKILLS</h2>
          <p className="text-[4.5px] text-gray-700">Product Strategy</p>
          <p className="text-[4.5px] text-gray-700">Agile/Scrum</p>
        </div>
      </div>
    </div>
  );

  const renderExecutiveTemplate = () => (
    <div className="w-full h-full bg-white text-black p-4 text-[6px] leading-tight">
      <div className="flex gap-3 mb-2">
        <div className="w-14 h-14 bg-gray-300 rounded flex items-center justify-center flex-shrink-0">
          <User className="w-8 h-8 text-gray-600" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-[11px] mb-0.5">MICHAEL CHEN</h1>
          <p className="text-[6px] text-gray-600 mb-1">Chief Technology Officer</p>
          <p className="text-[4.5px] text-gray-600">michael.chen@email.com • San Francisco, CA</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="bg-gray-50 p-1.5 rounded">
          <h2 className="font-bold text-[6px] mb-0.5">PROFESSIONAL SUMMARY</h2>
          <p className="text-[4.5px] text-gray-700">Technology executive with 15+ years experience...</p>
        </div>
        <div>
          <h2 className="font-bold text-[6px] mb-0.5">LEADERSHIP EXPERIENCE</h2>
          <p className="text-[5px] font-semibold">CTO • Tech Innovations Inc</p>
          <p className="text-[4.5px] text-gray-600">2019 - Present</p>
        </div>
      </div>
    </div>
  );

  const renderCreativePhotoTemplate = () => (
    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 text-black p-4 text-[6px] leading-tight">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">SARAH WILLIAMS</h1>
          <p className="text-[6px] text-gray-700">UX/UI Designer</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="bg-white/70 backdrop-blur p-1.5 rounded">
          <h2 className="font-bold text-[6px] text-indigo-600 mb-0.5">ABOUT</h2>
          <p className="text-[4.5px]">Creative designer passionate about user experience...</p>
        </div>
        <div className="bg-white/70 backdrop-blur p-1.5 rounded">
          <h2 className="font-bold text-[6px] text-indigo-600 mb-0.5">EXPERIENCE</h2>
          <p className="text-[4.5px] font-semibold">Lead Designer • Design Studio</p>
        </div>
      </div>
    </div>
  );

  const renderMinimalTemplate = () => (
    <div className="w-full h-full bg-white text-black p-4 text-[6px] leading-tight">
      <h1 className="font-bold text-[10px] mb-0.5">Kriti Jaiswal</h1>
      <div className="text-[4.5px] text-gray-600 mb-2 flex gap-2">
        <span>📞 +91-xxxxxxxxxx</span>
        <span>✉ kriti@yahoo.com</span>
        <span>🔗 linkedin.com/in/kriti-jaiswal</span>
      </div>
      <div className="space-y-1.5">
        <div>
          <h2 className="font-bold text-[6.5px] mb-0.5">EDUCATION</h2>
          <p className="text-[5px] font-semibold">XYZ Professional University</p>
          <p className="text-[4.5px] text-gray-600 italic">Bachelor of Technology - Computer Science • CGPA: 8.60</p>
        </div>
        <div>
          <h2 className="font-bold text-[6.5px] mb-0.5">EXPERIENCE</h2>
          <p className="text-[5px] font-semibold">Software Development Engineer Intern</p>
          <p className="text-[4.5px] text-gray-600">GE Digital • Jan 2024 - July 2024</p>
        </div>
        <div>
          <h2 className="font-bold text-[6.5px] mb-0.5">TECHNICAL SKILLS</h2>
          <p className="text-[4.5px] text-gray-700"><span className="font-semibold">Languages:</span> C++, C, Java, JavaScript, Python</p>
        </div>
      </div>
    </div>
  );

  const renderTwoColumnTemplate = () => (
    <div className="w-full h-full bg-white text-black p-3 text-[6px] leading-tight">
      <div className="flex gap-2">
        <div className="w-2/5 space-y-1.5">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-[6px] mb-1">CONTACT</h2>
            <p className="text-[4.5px] text-gray-700 mb-0.5">📞 +1-234-567</p>
            <p className="text-[4.5px] text-gray-700">✉ email@mail.com</p>
          </div>
          <div>
            <h2 className="font-bold text-[6px] mb-1">SKILLS</h2>
            <p className="text-[4.5px] text-gray-700">• JavaScript</p>
            <p className="text-[4.5px] text-gray-700">• React</p>
            <p className="text-[4.5px] text-gray-700">• Node.js</p>
          </div>
        </div>
        <div className="w-3/5 space-y-1.5">
          <h1 className="font-bold text-[10px]">ALEX RIVERA</h1>
          <p className="text-[6px] text-gray-600 mb-2">Full Stack Developer</p>
          <div>
            <h2 className="font-bold text-[6px] mb-0.5">EXPERIENCE</h2>
            <p className="text-[5px] font-semibold">Senior Developer</p>
            <p className="text-[4.5px] text-gray-600">Tech Startup • 2022-Now</p>
          </div>
          <div>
            <h2 className="font-bold text-[6px] mb-0.5">EDUCATION</h2>
            <p className="text-[5px] font-semibold">BS Computer Science</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSidebarPhotoTemplate = () => (
    <div className="w-full h-full bg-white text-black p-0 text-[6px] leading-tight flex">
      <div className="w-1/3 bg-slate-700 text-white p-3 space-y-2">
        <div className="w-14 h-14 bg-slate-500 rounded-full mx-auto mb-2 flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h2 className="font-bold text-[6px] mb-1">CONTACT</h2>
          <p className="text-[4.5px] text-slate-300">+1-555-0123</p>
          <p className="text-[4.5px] text-slate-300">email@example.com</p>
        </div>
        <div>
          <h2 className="font-bold text-[6px] mb-1">SKILLS</h2>
          <div className="space-y-0.5 text-[4.5px] text-slate-300">
            <p>• Python</p>
            <p>• Data Analysis</p>
            <p>• Machine Learning</p>
          </div>
        </div>
      </div>
      <div className="w-2/3 p-3 space-y-1.5">
        <h1 className="font-bold text-[10px]">EMILY RODRIGUEZ</h1>
        <p className="text-[6px] text-gray-600 mb-2">Data Scientist</p>
        <div>
          <h2 className="font-bold text-[6.5px] mb-0.5">EXPERIENCE</h2>
          <p className="text-[5px] font-semibold">Senior Data Scientist</p>
          <p className="text-[4.5px] text-gray-600">Analytics Corp • 2021-Present</p>
        </div>
        <div>
          <h2 className="font-bold text-[6.5px] mb-0.5">EDUCATION</h2>
          <p className="text-[5px] font-semibold">MS Data Science</p>
        </div>
      </div>
    </div>
  );

  const renderElegantTemplate = () => (
    <div className="w-full h-full bg-gradient-to-b from-slate-50 to-white text-black p-4 text-[6px] leading-tight">
      <div className="border-b-2 border-slate-800 pb-2 mb-2">
        <h1 className="font-bold text-[11px] tracking-wide">DAVID THOMPSON</h1>
        <p className="text-[6px] text-gray-600">Business Analyst</p>
      </div>
      <div className="flex gap-3 text-[4.5px] text-gray-600 mb-2">
        <span>📧 david.t@email.com</span>
        <span>📞 +1-555-1234</span>
        <span>📍 New York, NY</span>
      </div>
      <div className="space-y-1.5">
        <div>
          <h2 className="font-bold text-[6.5px] tracking-wide mb-0.5">PROFESSIONAL EXPERIENCE</h2>
          <p className="text-[5px] font-semibold">Senior Business Analyst</p>
          <p className="text-[4.5px] text-gray-600">Fortune 500 Company • 2020-Present</p>
        </div>
        <div>
          <h2 className="font-bold text-[6.5px] tracking-wide mb-0.5">EDUCATION</h2>
          <p className="text-[5px] font-semibold">MBA - Business Analytics</p>
          <p className="text-[4.5px] text-gray-600">Top University • 2019</p>
        </div>
      </div>
    </div>
  );

  const renderTemplate = () => {
    switch (variant) {
      case "professional":
        return renderProfessionalTemplate();
      case "modern-photo":
        return renderModernPhotoTemplate();
      case "executive":
        return renderExecutiveTemplate();
      case "creative-photo":
        return renderCreativePhotoTemplate();
      case "minimal":
        return renderMinimalTemplate();
      case "two-column":
        return renderTwoColumnTemplate();
      case "sidebar-photo":
        return renderSidebarPhotoTemplate();
      case "elegant":
        return renderElegantTemplate();
      default:
        return renderMinimalTemplate();
    }
  };

  return (
    <Card
      className={`overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${isSelected ? 'ring-2 ring-primary border-primary shadow-lg scale-[1.02]' : ''}`}
      onClick={() => onSelect(id)}
      data-testid={`card-template-${id}`}
    >
      <div className="relative aspect-[8.5/11] bg-muted">
        <div className="absolute inset-0 p-3">
          {renderTemplate()}
        </div>
        {isPremium && (
          <Badge className="absolute top-3 right-3 bg-chart-4 text-foreground gap-1">
            <Crown className="w-3 h-3" />
            Premium
          </Badge>
        )}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-background/95 backdrop-blur px-4 py-2 rounded-lg">
            <p className="text-sm font-semibold">Click to use template</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1" data-testid={`text-template-name-${id}`}>{name}</h3>
      </div>
    </Card>
  );
}
