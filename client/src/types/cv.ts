export interface CVExperience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface CVProject {
  id: string;
  name: string;
  tech: string;
  description: string;
  impact: string;
}

export interface CVSkills {
  raw: string;
  technical: string[];
  frameworks: string[];
  softSkills: string[];
  languages: string[];
}

export interface CVFormData {
  // Legacy fields (kept for backward compatibility with old templates)
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  summary: string;
  
  // Backward compatibility fields
  experience1Title?: string;
  experience1Company?: string;
  experience1Period?: string;
  experience1Desc?: string;
  experience2Title?: string;
  experience2Company?: string;
  experience2Period?: string;
  experience2Desc?: string;
  
  education: string;
  educationSchool: string;
  educationYear: string;
  skills: string; // Legacy flat string
  
  // New Structured Fields
  portfolio?: string;
  experiences: CVExperience[];
  projects: CVProject[];
  structuredSkills?: CVSkills;
}

export const defaultCVData: CVFormData = {
  name: "John Smith",
  jobTitle: "Senior Software Engineer",
  email: "john@email.com",
  phone: "123-456-7890",
  linkedin: "linkedin.com/in/johnsmith",
  location: "New York, NY",
  portfolio: "github.com/johnsmith",
  summary: "Experienced software engineer with 5+ years in full-stack development. Proven track record of building scalable web applications.",
  education: "Bachelor of Science in Computer Science",
  educationSchool: "University Name",
  educationYear: "2018",
  skills: "JavaScript • TypeScript • React • Node.js • Python • SQL",
  experiences: [
    {
      id: "1",
      title: "Senior Software Engineer",
      company: "Tech Corp",
      period: "2020 - Present",
      description: "Led backend team to migrate monolith to microservices. Improved API response time by 40%."
    },
    {
      id: "2",
      title: "Software Engineer",
      company: "Web Solutions Inc.",
      period: "2018 - 2020",
      description: "Developed and maintained React frontends for various e-commerce clients. Increased conversion rates by 15%."
    }
  ],
  projects: [
    {
      id: "1",
      name: "E-commerce Platform",
      tech: "React, Node.js, MongoDB",
      description: "Built a full-stack e-commerce platform with Stripe integration.",
      impact: "Processed over $10k in sales within the first month."
    }
  ],
  structuredSkills: {
    raw: "JavaScript, TypeScript, React, Node.js, Python, SQL, Communication, Teamwork",
    technical: ["JavaScript", "TypeScript", "Python", "SQL"],
    frameworks: ["React", "Node.js"],
    softSkills: ["Communication", "Teamwork"],
    languages: ["English"]
  }
};
