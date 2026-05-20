# ResuMind AI - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based (Gen Z Creative Tools)  
**Primary References:** Canva (creative energy), Notion (modern productivity), Linear (clean UI), Figma (design tools)

**Core Principles:**
- Bold, vibrant colors that energize without overwhelming
- Playful yet professional - balancing creativity with credibility
- Smooth, intuitive interactions with generous spacing
- Clear visual hierarchy guiding users through complex workflows

---

## Color Palette

### Light Mode
- **Primary Brand:** 270 95% 60% (vibrant purple)
- **Secondary:** 340 85% 55% (energetic pink)
- **Accent:** 200 90% 50% (bright cyan)
- **Background:** 0 0% 98% (soft white)
- **Surface:** 0 0% 100% (pure white)
- **Text Primary:** 240 10% 15% (near black)
- **Text Secondary:** 240 5% 45% (medium gray)

### Dark Mode
- **Primary Brand:** 270 85% 65% (lighter purple)
- **Secondary:** 340 75% 60% (softer pink)
- **Accent:** 200 80% 55% (muted cyan)
- **Background:** 240 8% 12% (rich dark)
- **Surface:** 240 6% 18% (elevated dark)
- **Text Primary:** 0 0% 95% (soft white)
- **Text Secondary:** 240 3% 65% (light gray)

---

## Typography

**Font Stack:** Inter (primary), SF Pro Display (headings via system fonts)

**Type Scale:**
- Hero/Display: text-5xl to text-7xl, font-bold, tracking-tight
- Page Headings: text-3xl to text-4xl, font-semibold
- Section Titles: text-xl to text-2xl, font-semibold
- Body Large: text-lg, font-normal, leading-relaxed
- Body: text-base, font-normal, leading-normal
- Small/Caption: text-sm, font-medium

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24

**Container Strategy:**
- Page containers: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Content sections: py-12 lg:py-20
- Card padding: p-6 lg:p-8
- Button padding: px-6 py-3

**Grid Patterns:**
- Feature cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Template gallery: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8
- Two-column layouts: lg:grid-cols-2 gap-12

---

## Component Library

### Navigation
- **Navbar:** Sticky header with blur backdrop (backdrop-blur-lg bg-white/80 dark:bg-gray-900/80), logo left, nav links center, dark mode toggle + CTA right
- **Footer:** Three-column grid on desktop (About, Quick Links, Contact), single column mobile, py-12 with divider

### Buttons
- **Primary:** Rounded-lg px-6 py-3, gradient from primary to secondary, bold text, shadow-lg, transform hover:scale-105 transition
- **Secondary:** Rounded-lg px-6 py-3, border-2 border-primary, transparent background, backdrop-blur when over images
- **Icon Buttons:** Rounded-full p-3, hover:bg-primary/10

### Cards
- **Feature Cards:** Rounded-2xl p-8, gradient border (border-2), shadow-xl hover:shadow-2xl, transform hover:-translate-y-1 transition-all
- **Template Cards:** Rounded-xl overflow-hidden, image with aspect-video, content p-6, "Free"/"Premium" badge top-right
- **Dashboard Cards:** Rounded-xl p-6, border border-gray-200 dark:border-gray-700, subtle background

### Forms
- **Input Fields:** Rounded-lg px-4 py-3, border-2 focus:border-primary, bg-white dark:bg-gray-800, transition-colors
- **Upload Zone:** Dashed border-2 rounded-xl p-12, drag-drop area with icon and text, hover:border-primary
- **Editable Preview:** Monaco-editor style with line numbers, syntax highlighting for structure

### Special Elements
- **ATS Score Display:** Large circular progress (stroke-dasharray animation), percentage center, color-coded (green 80+, yellow 60-79, red <60)
- **Recommendation Chips:** Rounded-full px-4 py-2, vibrant backgrounds, inline-flex with icons
- **Toggle Switch:** Rounded-full with smooth slide animation, sun/moon icons for theme

---

## Page-Specific Layouts

### Login Page
Clean centered card (max-w-md) with gradient background pattern, logo top, form fields, primary CTA button, shadow-2xl

### Home Page
- **Hero Section:** No traditional hero - start with bold typography statement (text-6xl gradient text), three large feature boxes immediately below (grid gap-8, each with icon, title, description, arrow)
- **Feature Boxes:** Oversized cards (h-64) with gradient backgrounds, hover:scale-105, clear CTAs

### Generator Pages
Two-column split: Left sidebar (30%) with options/questions, Right panel (70%) with live preview, sticky positioning for preview

### Screening/Analysis Pages  
Upload section top, results dashboard below with metrics grid, recommendation cards, and detailed breakdown accordion

---

## Images

**Hero/Marketing Images:** NOT USED - This is a productivity tool, lead with feature boxes instead

**Supporting Images:**
- **Template Previews:** Generated resume/CV screenshots within template cards (use placeholder images showing realistic resume layouts)
- **Dashboard Icons:** Custom illustrations for features (resume icon, screening badge, CV document) - use SVG illustrations from undraw.co or similar
- **Empty States:** Friendly illustrations for "no resume uploaded" states

---

## Animations

**Minimal Approach:**
- Page transitions: Subtle fade-in (opacity 0→1, 200ms)
- Card hovers: Scale 1→1.02 and shadow increase
- ATS score: Circular progress animation on mount (1s ease-out)
- Theme toggle: 300ms smooth transition on all color properties
- NO parallax, NO scroll-triggered animations, NO distracting motion