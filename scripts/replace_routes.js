const fs = require('fs');
const content = fs.readFileSync('server/routes.ts', 'utf8');

const analyzeStart = "app.post('/api/cv/analyze'";
const optimizeStart = 'app.post("/api/cv/optimize"';

let startIdx = content.indexOf(analyzeStart);
// Because startIdx points to "app.post", we also want the indentation spaces before it for the new block
while(startIdx > 0 && content[startIdx - 1] === ' ') {
    startIdx--;
}

const optimizeIdx = content.indexOf(optimizeStart);

if (startIdx === -1 || optimizeIdx === -1) {
  console.log("Could not find boundaries!", startIdx, optimizeIdx);
  process.exit(1);
}

// Find the indentation of optimizeStart to prefix the new block properly
let optimizeIndentation = 0;
let tempIdx = optimizeIdx;
while(tempIdx > 0 && content[tempIdx - 1] === ' ') {
    optimizeIndentation++;
    tempIdx--;
}

const newBlock = `  app.post('/api/cv/analyze', async (req, res) => {
    console.log('=== ANALYZE CV CALLED ===')

    try {
      const { fileBase64, fileType, fileName, targetRole, userId } = req.body

      console.log('fileName:', fileName)
      console.log('targetRole:', targetRole)
      console.log('base64 length:', fileBase64?.length)
      console.log('GEMINI KEY exists:', !!process.env.GEMINI_API_KEY)

      // Validate inputs
      if (!fileBase64) {
        return res.status(400).json({ success: false, message: 'No file data received' })
      }
      if (!targetRole) {
        return res.status(400).json({ success: false, message: 'Target role is required' })
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, message: 'Gemini API key not configured' })
      }

      // Determine mime type
      const mimeType = fileType?.includes('wordprocessingml')
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf'

      console.log('Sending file directly to Gemini...')

      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

      // Send PDF directly to Gemini — no text extraction needed
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: fileBase64
          }
        },
        {
          text: \`You are an expert CV analyzer and career coach.
Carefully read this entire CV document and analyze it for a "\${targetRole}" position.

Return ONLY a valid JSON object.
No markdown. No backticks. No explanation. Just JSON.

{
  "overallScore": number between 0-100,
  "atsScore": number between 0-100,
  "interviewChance": number between 0-100,
  "sections": {
    "summary": { "score": number, "status": "strong or weak or missing", "feedback": "specific actionable feedback" },
    "experience": { "score": number, "status": "strong or weak or missing", "feedback": "specific actionable feedback" },
    "education": { "score": number, "status": "strong or weak or missing", "feedback": "specific actionable feedback" },
    "skills": { "score": number, "status": "strong or weak or missing", "feedback": "specific actionable feedback" }
  },
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"],
  "missingKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"]
}\`
        }
      ])

      const responseText = result.response.text()
      console.log('Gemini response received')

      // Clean and parse JSON
      const cleanJson = responseText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()

      let analysis
      try {
        analysis = JSON.parse(cleanJson)
      } catch {
        // Try to extract JSON from response
        const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/)
        if (!jsonMatch) {
          throw new Error('Gemini returned invalid JSON format')
        }
        analysis = JSON.parse(jsonMatch[0])
      }

      console.log('Analysis score:', analysis.overallScore)

      // Save to Supabase using existing StorageService flow
      if (req.isAuthenticated()) {
        const authUserId = (req.user as any).id;
        try {
          const savedAnalysis = await StorageService.saveAnalysis(authUserId, {
            fileName: fileName || "upload",
            targetRole,
            overallScore: analysis.overallScore,
            atsScore: analysis.atsScore,
            interviewChance: analysis.interviewChance,
            analysisData: analysis,
            extractedText: ''
          });
          console.log('Analysis saved:', savedAnalysis.id);
        } catch(dbErr: any) {
          console.warn('DB save failed (non-blocking):', dbErr.message);
        }
      }

      return res.json({ success: true, analysis })

    } catch (error: any) {
      console.error('=== ANALYZE ERROR ===')
      console.error('Message:', error.message)
      console.error('Status:', error.status)

      // Specific error messages
      if (error.status === 404 || error.message?.includes('not found')) {
        return res.status(500).json({ success: false, message: 'AI model not found. Check Gemini model name.' })
      }
      if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
        return res.status(500).json({ success: false, message: 'Invalid Gemini API key in .env' })
      }
      if (error.message?.includes('quota') || error.message?.includes('RATE_LIMIT')) {
        return res.status(429).json({ success: false, message: 'Gemini rate limit. Wait and retry.' })
      }

      return res.status(500).json({ success: false, message: error.message || 'Analysis failed' })
    }
  });

`;

// optimizeIdx holds the start of the optimize string, but we want the actual line start including spaces.
let trueOptimizeIdx = optimizeIdx;
while(trueOptimizeIdx > 0 && content[trueOptimizeIdx - 1] === ' ') {
    trueOptimizeIdx--;
}

fs.writeFileSync('server/routes.ts', content.substring(0, startIdx) + newBlock + content.substring(trueOptimizeIdx));
console.log("Successfully replaced /api/cv/analyze block in routes.ts");
