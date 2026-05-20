// server/lib/scoringEngine.ts

export const ROLE_KEYWORDS: Record<string, string[]> = {
  'ai researcher': [
    'machine learning', 'deep learning', 'neural networks',
    'pytorch', 'tensorflow', 'python', 'research',
    'publications', 'nlp', 'computer vision', 'transformers',
    'reinforcement learning', 'statistics', 'cuda', 'papers'
  ],
  'software engineer': [
    'javascript', 'typescript', 'react', 'node.js',
    'python', 'java', 'git', 'api', 'database',
    'algorithms', 'data structures', 'testing', 'agile', 'aws', 'docker', 'ci/cd'
  ],
  'data scientist': [
    'python', 'r', 'sql', 'machine learning', 'statistics',
    'pandas', 'numpy', 'visualization', 'modeling',
    'hypothesis testing', 'regression', 'classification', 'tableau', 'big data'
  ],
  'product manager': [
    'roadmap', 'stakeholders', 'agile', 'scrum', 'kpis',
    'user research', 'prioritization', 'metrics', 'strategy',
    'cross-functional', 'requirements', 'analytics', 'jira', 'go-to-market'
  ],
  'frontend developer': [
    'react', 'vue', 'angular', 'javascript', 'typescript',
    'html', 'css', 'sass', 'tailwind', 'webpack',
    'responsive design', 'ux/ui', 'performance', 'accessibility', 'git'
  ],
  'backend developer': [
    'node.js', 'python', 'java', 'go', 'c#',
    'sql', 'nosql', 'mongodb', 'postgresql', 'redis',
    'api design', 'microservices', 'docker', 'kubernetes', 'aws', 'system design'
  ],
  'devops engineer': [
    'linux', 'bash', 'python', 'aws', 'azure', 'gcp',
    'ci/cd', 'jenkins', 'gitlab', 'docker', 'kubernetes',
    'terraform', 'ansible', 'monitoring', 'prometheus', 'grafana'
  ],
  'marketing manager': [
    'seo', 'sem', 'content strategy', 'social media', 'google analytics',
    'campaigns', 'email marketing', 'hubspot', 'crm',
    'copywriting', 'brand management', 'b2b', 'b2c', 'lead generation'
  ],
  'sales executive': [
    'prospecting', 'b2b sales', 'crm', 'salesforce', 'negotiation',
    'closing', 'account management', 'cold calling', 'forecasting',
    'lead generation', 'territory management', 'presentations'
  ],
  'financial analyst': [
    'financial modeling', 'forecasting', 'excel', 'variance analysis',
    'budgeting', 'valuation', 'bloomberg', 'erp', 'accounting',
    'corporate finance', 'data analysis', 'reporting'
  ],
  'human resources': [
    'recruitment', 'onboarding', 'employee relations', 'hris',
    'performance management', 'talent acquisition', 'payroll',
    'compliance', 'benefits administration', 'ats', 'successfactors'
  ],
  'ux/ui designer': [
    'figma', 'sketch', 'adobe xd', 'wireframing', 'prototyping',
    'user research', 'usability testing', 'interaction design',
    'visual design', 'information architecture', 'design systems', 'persona'
  ],
  'business analyst': [
    'requirements gathering', 'process modeling', 'sql', 'tableau',
    'agile', 'scrum', 'jira', 'user stories', 'diagrams',
    'stakeholder management', 'data mapping', 'gap analysis'
  ],
  'cybersecurity analyst': [
    'network security', 'penetration testing', 'vulnerability assessment',
    'siem', 'firewalls', 'incident response', 'linux', 'wireshark',
    'cryptography', 'owasp', 'risk management', 'compliance'
  ],
  'project manager': [
    'agile', 'waterfall', 'scrum', 'kanban', 'jira', 'ms project',
    'budget management', 'risk management', 'stakeholder communication',
    'resource allocation', 'pmp', 'sprint planning', 'delivery'
  ],
  'cloud architect': [
    'aws', 'azure', 'gcp', 'terraform', 'kubernetes',
    'system design', 'microservices', 'security', 'networking',
    'serverless', 'iaas', 'paas', 'docker', 'cost optimization'
  ],
  'mobile developer': [
    'swift', 'kotlin', 'react native', 'flutter', 'ios', 'android',
    'mobile ui', 'api integration', 'coredata', 'sqlite', 'app store',
    'google play', 'testing', 'architecture'
  ],
  'qa engineer': [
    'automated testing', 'manual testing', 'selenium', 'cypress', 'jest',
    'junit', 'test cases', 'bug tracking', 'jira', 'api testing',
    'postman', 'regression testing', 'ci/cd'
  ],
  'database administrator': [
    'sql server', 'oracle', 'postgresql', 'mysql', 'performance tuning',
    'backup/recovery', 'replication', 'high availability', 'nosql',
    'schema design', 'indexing', 'scripting'
  ],
  'graphic designer': [
    'adobe creative suite', 'photoshop', 'illustrator', 'indesign',
    'typography', 'branding', 'print design', 'layout',
    'color theory', 'logo design', 'composition', 'digital media'
  ],
  'civil engineer': [
    'autocad', 'civil 3d', 'structural analysis', 'project management',
    'site planning', 'surveying', 'construction materials', 'drainage',
    'code compliance', 'estimation', 'safety regulations'
  ],
  'nurse': [
    'patient care', 'vital signs', 'ehr', 'epic', 'medication administration',
    'triage', 'bls', 'acls', 'cpr', 'charting',
    'patient education', 'infection control', 'clinical procedures'
  ],
  'teacher': [
    'lesson planning', 'curriculum development', 'classroom management',
    'student assessment', 'special education', 'instructional design',
    'differentiated instruction', 'educational technology', 'mentoring'
  ]
};

export const getKeywordsForRole = (role: string): string[] => {
  const normalized = role.toLowerCase().trim();
  return ROLE_KEYWORDS[normalized] || ROLE_KEYWORDS['software engineer']; // fallback
};

export const getRequiredSkillsForRole = (role: string): string[] => {
  // We mirror the keywords as skills for the mathematical scoring context
  return getKeywordsForRole(role);
};

export const getDomainKeywords = (role: string): string[] => {
  // Domain constraints mimic base keywords logic 
  return getKeywordsForRole(role);
};

/**
 * Mocking getTFIDFScore since the external Python TF-IDF engine dependency
 * is not natively accessible in our local Node environment yet.
 * We return a simulated high semantic score baseline between 65 and 95
 * depending on string length density.
 */
export const getTFIDFScore = async (extractedText: string, targetRole: string): Promise<number> => {
  if (!extractedText) return 50;
  
  const textLength = extractedText.length;
  if (textLength < 500) return 60; // weak semantic depth
  if (textLength > 3000) return 96; // strong semantic depth
  
  // Math bounds resolving roughly between 70 and 95
  return Math.min(100, Math.max(65, Math.floor(65 + (textLength / 100))));
};
