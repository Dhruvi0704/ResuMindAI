export const SKILL_ONTOLOGY = {
  // AI & Machine Learning
  "python": ["python", "python3"],
  "machine learning": ["machine learning", "ml"],
  "deep learning": ["deep learning", "dl"],
  "tensorflow": ["tensorflow", "tf"],
  "pytorch": ["pytorch", "torch"],
  "keras": ["keras"],
  "scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
  "nlp": ["nlp", "natural language processing"],
  "computer vision": ["computer vision", "cv"],
  "generative ai": ["generative ai", "genai", "llm", "large language models"],
  "pandas": ["pandas"],
  "numpy": ["numpy"],
  "langchain": ["langchain"],
  "openai": ["openai", "gpt"],

  // Frontend
  "javascript": ["javascript", "js", "ecmascript"],
  "typescript": ["typescript", "ts"],
  "react": ["react", "react.js", "reactjs", "react js"],
  "next.js": ["next.js", "nextjs", "next"],
  "vue": ["vue", "vue.js", "vuejs"],
  "angular": ["angular", "angular.js"],
  "html": ["html", "html5"],
  "css": ["css", "css3"],
  "tailwind": ["tailwind", "tailwindcss"],
  "sass": ["sass", "scss"],
  "redux": ["redux"],
  "framer motion": ["framer motion", "framer"],

  // Backend
  "node.js": ["node.js", "nodejs", "node"],
  "express": ["express", "express.js"],
  "nest.js": ["nest.js", "nestjs"],
  "django": ["django"],
  "flask": ["flask"],
  "fastapi": ["fastapi"],
  "java": ["java"],
  "spring boot": ["spring boot", "springboot", "spring"],
  "c#": ["c#", "csharp", "c sharp"],
  ".net": [".net", "dotnet", "asp.net"],
  "go": ["go", "golang"],
  "ruby": ["ruby"],
  "ruby on rails": ["ruby on rails", "rails"],
  "php": ["php"],
  "laravel": ["laravel"],
  "rust": ["rust"],
  "c++": ["c++", "cpp"],

  // Databases
  "sql": ["sql"],
  "postgresql": ["postgresql", "postgres"],
  "mysql": ["mysql"],
  "mongodb": ["mongodb", "mongo"],
  "redis": ["redis"],
  "elasticsearch": ["elasticsearch"],
  "cassandra": ["cassandra"],
  "dynamodb": ["dynamodb"],
  "sqlite": ["sqlite"],
  "prisma": ["prisma"],
  "drizzle": ["drizzle", "drizzle-orm", "drizzle orm"],

  // DevOps & Cloud
  "aws": ["aws", "amazon web services"],
  "azure": ["azure", "microsoft azure"],
  "gcp": ["gcp", "google cloud platform", "google cloud"],
  "docker": ["docker"],
  "kubernetes": ["kubernetes", "k8s"],
  "ci/cd": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
  "github actions": ["github actions"],
  "jenkins": ["jenkins"],
  "gitlab ci": ["gitlab ci"],
  "terraform": ["terraform"],
  "linux": ["linux"],
  "bash": ["bash", "shell scripting", "shell"],

  // Tools & Others
  "git": ["git"],
  "agile": ["agile", "scrum"],
  "jira": ["jira"],
  "rest api": ["rest api", "rest", "restful api"],
  "graphql": ["graphql", "gql"],
  "websockets": ["websockets", "ws", "socket.io"],
  "microservices": ["microservices"]
};

/**
 * Normalizes text for keyword matching.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s\.\#\+]/g, " ") // Keep alphanumeric, dots, hashes, pluses (C++, C#, Node.js)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts and standardizes recognized skills from a given text.
 */
export function extractRecognizedSkills(text: string): string[] {
  const normalized = normalizeText(text);
  const foundSkills = new Set<string>();

  // Iterating to find matches. We check if the alias appears as an exact word boundary match.
  for (const [canonical, aliases] of Object.entries(SKILL_ONTOLOGY)) {
    for (const alias of aliases) {
      // Create a regex to find the alias as a whole word, 
      // but escape regex characters like +, ., #
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|\\s)(?:${escapedAlias})(?:\\s|$)`, "i");
      
      if (regex.test(normalized)) {
        foundSkills.add(canonical);
        break; // Match found, move to next canonical skill
      }
    }
  }

  return Array.from(foundSkills);
}
