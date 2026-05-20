const fs = require('fs');
const content = fs.readFileSync('server/routes.ts', 'utf8');

// The original route had app.post("/api/cv/optimize", upload.single("cvFile"), ...
// Now we are replacing it with a POST to /improve that takes JSON instead of formData.
// Actually the user explicitly provided router.post('/api/cv/improve', async (req, res) => { ...
// I will append it right before the cv/optimize route and we can keep optimize or replace it, but since I already replaced handleImproveWithAI to call /api/cv/improve, I just need to add /api/cv/improve to routes.ts.

const newRoute = `
  app.post('/api/cv/improve', async (req, res) => {
    console.log('=== IMPROVE CV CALLED ===')
    
    try {
      const { fileBase64, fileType, fileName, targetRole, userId, analysisData } = req.body

      if (!fileBase64) {
        return res.status(400).json({ success: false, message: 'No file received' })
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      const mimeType = fileType?.includes('wordprocessingml')
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf'

      console.log('Sending to Gemini for improvement...')

      const result = await model.generateContent([
        {
          inlineData: { mimeType: mimeType, data: fileBase64 }
        },
        {
          text: \`You are an expert CV writer and career coach.
Read this CV carefully and rewrite it optimized for a "\${targetRole}" position.

RULES:
- Do NOT invent fake experience or qualifications
- Keep all real information but rewrite powerfully
- Use strong action verbs (led, engineered, delivered)
- Add quantifiable metrics where missing
- Optimize for ATS keyword matching for \${targetRole}
- Improve professional summary to be compelling
- Reorganize bullet points for maximum impact

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "personalInfo": { "name": "string", "title": "string", "email": "string", "phone": "string", "location": "string", "linkedin": "string" },
  "summary": "improved summary paragraph string",
  "experience": [ { "role": "string", "company": "string", "startDate": "string", "endDate": "string", "bullets": ["improved bullet 1"] } ],
  "education": [ { "degree": "string", "institution": "string", "year": "string", "gpa": "string" } ],
  "skills": ["skill1", "skill2"],
  "improvements": ["what was changed and why 1"]
}\`
        }
      ])

      const responseText = result.response.text()
      console.log('Gemini improvement response received')

      const cleanJson = responseText.replace(/\\\`\\\`\\\`json/gi, '').replace(/\\\`\\\`\\\`/g, '').trim()

      let improvedCV
      try {
        improvedCV = JSON.parse(cleanJson)
      } catch {
        const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/)
        if (!jsonMatch) throw new Error('AI returned invalid response format')
        improvedCV = JSON.parse(jsonMatch[0])
      }

      console.log('CV improved successfully')

      // Save to Supabase (non-blocking)
      if (req.isAuthenticated()) {
        const authUserId = (req.user as any).id;
        try {
          await StorageService.saveAnalysis(authUserId, {
            fileName: fileName || "upload",
            targetRole,
            overallScore: 0,
            atsScore: 0,
            interviewChance: 0,
            analysisData: improvedCV,
            extractedText: ''
          })
        } catch (dbErr: any) {
          console.warn('DB save failed:', dbErr.message)
        }
      }

      return res.json({ success: true, improvedCV, improvements: improvedCV.improvements || [] })

    } catch (error: any) {
      console.error('=== IMPROVE CV ERROR ===', error.message)

      if (error.message?.includes('quota') || error.message?.includes('RATE_LIMIT') || error.status === 429) {
        return res.status(429).json({ success: false, message: 'Rate limit reached. Please wait and retry.' })
      }
      return res.status(500).json({ success: false, message: error.message || 'Optimization failed' })
    }
  })
`;

// Just append the route before app.post("/api/cv/optimize"
const index = content.indexOf('app.post("/api/cv/optimize"');
if (index === -1) {
    console.error("Could not find /api/cv/optimize to inject before.");
    process.exit(1);
}

fs.writeFileSync('server/routes.ts', content.slice(0, index) + newRoute + content.slice(index));
console.log("Successfully injected /api/cv/improve route!");
