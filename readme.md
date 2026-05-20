# ResuMind AI

## Overview

ResuMind AI is a modern web application designed for Gen Z professionals to create ATS-friendly resumes and CVs. The platform offers AI-powered resume generation, resume screening with scoring, and CV building tools with multiple professional templates. The application features a vibrant, creative design inspired by tools like Canva, Notion, and Linear, while maintaining professional credibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management

**UI Component System**
- Shadcn UI component library with Radix UI primitives for accessible, customizable components
- Tailwind CSS for styling with custom design tokens
- Class Variance Authority (CVA) for component variant management
- Custom theme system supporting light/dark modes with design guidelines emphasizing vibrant Gen Z aesthetics

**Design Philosophy**
- Vibrant color palette with bold purples, pinks, and cyans
- Smooth interactions with elevation effects (hover-elevate, active-elevate-2 classes)
- Professional yet playful aesthetic balancing creativity and credibility
- Inter font family for consistent typography

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- RESTful API pattern with `/api` prefix for all application routes
- Middleware-based architecture for request processing
- Custom error handling middleware

**Development Features**
- Vite middleware integration for HMR in development
- Request/response logging middleware
- Development-only Replit plugins (cartographer, dev banner) for enhanced DX

**Storage Layer**
- In-memory storage implementation (`MemStorage`) for development
- Interface-based storage abstraction (`IStorage`) allowing easy migration to persistent storage
- User management with basic CRUD operations

### Data Layer

**Database Configuration**
- Drizzle ORM configured for PostgreSQL
- Schema-first approach with TypeScript types generated from Drizzle schemas
- Neon Database serverless driver for PostgreSQL connections
- Database migrations managed through Drizzle Kit

**Schema Design**
- Users table with UUID primary keys, username, and password fields
- Zod validation schemas generated from Drizzle schemas for runtime validation
- Type inference for both insert and select operations

**Current State**
- Application currently uses in-memory storage for development
- Database schema and configuration ready for PostgreSQL integration
- Migration infrastructure in place for schema updates

### Key Features & Workflows

**Resume Generator**
- Two generation modes: Automatic (question-based) and Template-based
- 12+ professional templates with categories (Tech, Business, Creative, etc.)
- Free and premium template tiers
- Visual template preview system with multiple layout variants
- Editable preview before download
- PDF export using html2canvas and jsPDF

**Resume Screening (AI-Powered)**
- File upload for PDF/DOCX resumes (max 10MB)
- Dual scoring system: Keyword matching (TF-IDF) + Semantic analysis (SBERT)
- Python microservice for SBERT embeddings (sentence-transformers)
- Comprehensive ATS dashboard with 4 tabs: Overview, Keywords, Semantic, Recommendations
- Real-time analysis progress tracking with multi-phase indicator
- Skill gap analysis with category breakdown (Technical, Soft, Domain)
- Personalized improvement recommendations with priority levels
- Export analysis results as JSON
- Visual keyword heatmap and score comparison charts

**CV Generator**
- Academic and research-focused templates
- Create new or improve existing CV workflows
- Template selection with photo/non-photo variants
- File upload and analysis for existing CVs
- Industry-specific question flows

### External Dependencies

**UI & Component Libraries**
- @radix-ui/* packages (v1.x) - Accessible component primitives for dialogs, dropdowns, tooltips, etc.
- cmdk - Command palette interface
- embla-carousel-react - Carousel/slider functionality
- lucide-react - Icon library
- react-day-picker - Date picker component
- vaul - Drawer component

**Form & Validation**
- react-hook-form - Form state management
- @hookform/resolvers - Form validation resolvers
- zod - Schema validation library
- drizzle-zod - Generate Zod schemas from Drizzle tables

**Database & ORM**
- drizzle-orm - TypeScript ORM
- drizzle-kit - Migration and schema management tools
- @neondatabase/serverless - Neon serverless PostgreSQL driver

**Utilities**
- date-fns - Date manipulation
- clsx & tailwind-merge - Conditional CSS class management
- class-variance-authority - Component variant utilities
- nanoid - Unique ID generation

**Document Generation**
- html2canvas - Convert HTML to canvas for PDF generation
- jspdf - PDF creation library

**Session Management**
- connect-pg-simple - PostgreSQL session store for Express (configured but using in-memory currently)

**Development Tools**
- @replit/vite-plugin-* - Replit-specific development plugins
- tsx - TypeScript execution for development server
- esbuild - Production build bundler for server code

**Styling**
- tailwindcss - Utility-first CSS framework
- autoprefixer - PostCSS plugin for vendor prefixes

**AI & NLP Libraries**
- @google/generative-ai - Google Gemini AI integration for resume enhancement
- pdfjs-dist - PDF parsing and text extraction
- mammoth - DOCX file text extraction
- Python microservice (`ats-semantic-service/`) - SBERT semantic similarity analysis
  - sentence-transformers - Sentence embeddings for semantic analysis
  - flask - Python web framework for microservice API
  - flask-cors - CORS support for cross-origin requests

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- **Python 3.8+** (for ATS Resume Screening feature)
- pip (Python package manager)

### Installation

1. **Install Node.js dependencies:**

```bash
npm install
```

2. **Set up Python microservice (for ATS Resume Screening):**

```bash
cd ats-semantic-service
pip install -r requirements.txt
```

**Note:** First-time installation will download the SBERT model (~500MB). Ensure you have sufficient disk space and internet connection.

3. **Configure environment variables:**

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PYTHON_SERVICE_URL=http://localhost:5001
```

### Running the Application

**Development mode requires running TWO services:**

**Terminal 1 - Python Microservice:**
```bash
cd ats-semantic-service
python app.py
```

**Terminal 2 - Main Application:**
```bash
npm run dev
```

The application will be available at the URL shown in Terminal 2.

**Important:** For full ATS Resume Screening functionality, both services must be running. If the Python service is not running, the feature will fall back to keyword-only analysis.

### Production Build

```bash
npm run build
npm start
```

**Note:** In production, you'll need to deploy both the Node.js application and the Python microservice separately and configure the `PYTHON_SERVICE_URL` accordingly.

## Project Structure

```
ResuMindAI/
├── client/              # React frontend
│   └── src/
│       ├── components/  # Reusable UI components
│       │   └── ats/    # ATS-specific components
│       ├── pages/      # Page components
│       └── utils/      # Utility functions
├── server/             # Express backend
│   └── lib/           # Server-side libraries
│       ├── atsAnalysis.ts  # ATS analysis logic
│       ├── nlpUtils.ts     # NLP utilities
│       └── gemini.ts       # Gemini AI integration
├── shared/            # Shared types and utilities
│   └── atsTypes.ts   # ATS TypeScript types
├── ats-semantic-service/  # Python SBERT microservice
│   ├── app.py        # Flask application
│   ├── requirements.txt
│   └── README.md     # Detailed microservice documentation
└── .env              # Environment variables
```

## Features in Detail

### AI-Powered ATS Resume Screening

The Resume Screening feature uses a sophisticated dual-scoring system:

1. **Keyword Scoring (60% weight)**
   - TF-IDF based keyword extraction
   - Category-based matching (Technical, Soft Skills, Domain)
   - Synonym detection for common technical terms
   - Weighted scoring prioritizing technical and domain skills

2. **Semantic Scoring (40% weight)**
   - SBERT (Sentence-BERT) embeddings via Python microservice
   - Cosine similarity between resume and job description
   - Contextual understanding beyond keyword matching
   - Identifies semantic strengths and gaps

3. **Analysis Dashboard**
   - **Overview Tab:** Final score, dual score comparison, analysis summary
  - **Keywords Tab:** Keyword heatmap, skill gap analysis by category
   - **Semantic Tab:** Similarity percentage, contextual matches, semantic insights
   - **Recommendations Tab:** Personalized suggestions with priority levels

### Troubleshooting

**Issue: Python microservice won't start**
- Ensure Python 3.8+ is installed: `python --version`
- Install dependencies: `pip install -r ats-semantic-service/requirements.txt`
- Check if port 5001 is available

**Issue: ATS analysis fails with "fetch failed"**
- Ensure the Python microservice is running on port 5001
- Check the `.env` file has correct `PYTHON_SERVICE_URL`
- The system will fall back to keyword-only analysis if the Python service is unavailable

**Issue: Model download fails**
- Ensure stable internet connection
- Check available disk space (~500MB required)
- Download will resume if interrupted

## License

MIT