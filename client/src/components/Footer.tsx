import { Link } from "wouter";
import { FileText, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold">ResuMind AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Create professional ATS-friendly resumes and CVs with AI-powered tools designed for the modern job seeker.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" data-testid="link-footer-home">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/resume-generator" data-testid="link-footer-resume">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">Resume Generator</a>
                </Link>
              </li>
              <li>
                <Link href="/resume-screening" data-testid="link-footer-screening">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">Resume Screening</a>
                </Link>
              </li>
              <li>
                <Link href="/cv-generator" data-testid="link-footer-cv">
                  <a className="text-muted-foreground hover:text-foreground transition-colors">CV Generator</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@resumind.ai</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+91 9776543210</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Mumbai, Maharashtra</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ResuMind AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
