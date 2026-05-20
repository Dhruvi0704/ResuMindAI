  app.post('/api/cv/improve', async (req, res) => {
    try {
      const { fileBase64, fileType, fileName, targetRole, userId } = req.body

      if (!fileBase64 || !targetRole) {
        return res.status(400).json({
          success: false,
          message: !fileBase64 ? 'No file received' : 'Target role required'
        })
      }

      // STEP 1: Always extract text first
      let extractedText = ''

      const isDocx = fileType?.includes('wordprocessingml') || fileName?.endsWith('.docx')
      const isPdf  = fileType === 'application/pdf' || fileName?.endsWith('.pdf')

      if (isDocx) {
        const { createRequire } = await import('module')
        const reqLoader = createRequire(import.meta.url)
        const mammoth = reqLoader('mammoth')
        const buffer = Buffer.from(fileBase64, 'base64')
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value?.trim() || ''
        console.log('DOCX extracted:', extractedText.length)
      } else if (isPdf) {
        extractedText = 'PDF_NATIVE'
        console.log('PDF: will use native Gemini reading')
      }

      if (!extractedText && !isPdf) {
        return res.status(422).json({
          success: false,
          message: 'Could not read file content'
        })
      }

      // STEP 2: Build improve prompt
      const roleKeywords = getRoleKeywords(targetRole)
      
      const improvePrompt = `You are an expert CV writer.
Rewrite this CV to be optimized for: ${targetRole}

${extractedText !== 'PDF_NATIVE' ? \`CV CONTENT:\\n\${extractedText.substring(0, 2500)}\` : ''}

Rules:
- Keep all real information, improve wording only
- Add strong action verbs: Led, Built, Reduced, Increased
- Add quantified metrics where logical
- Include these keywords where relevant: ${roleKeywords.slice(0,10).join(', ')}
- Maximum 4 bullet points per job
- Keep bullets under 100 characters

Return ONLY this JSON structure:
{
  "personalInfo": {"name": "", "title": "${targetRole}", "email": "", "phone": "", "location": "", "linkedin": ""},
  "summary": "improved summary under 200 chars",
  "experience": [{"id": "exp_0", "role": "", "company": "", "startDate": "", "endDate": "", "bullets": ["bullet 1", "bullet 2"]}],
  "education": [{"id": "edu_0", "degree": "", "institution": "", "year": "", "gpa": ""}],
  "skills": ["skill1", "skill2", "skill3"],
  "improvements": ["change 1", "change 2"],
  "addedKeywords": ["kw1", "kw2"]
}`

      // STEP 3: Call AI with fallback
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      
      let improvedCVText = ''
      let usedGroq = false

      // Try Gemini
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 1200,
            temperature: 0.1
          }
        })

        const parts: any[] = []
        if (isPdf && extractedText === 'PDF_NATIVE') {
          parts.push({ inlineData: { mimeType: 'application/pdf', data: fileBase64 } })
        }
        parts.push({ text: improvePrompt })

        const result = await model.generateContent(parts)
        improvedCVText = result.response.text()
        console.log('✅ Gemini improve OK')

      } catch (geminiErr: any) {
        const isQuota = geminiErr.status === 429 || geminiErr.message?.includes('quota') || geminiErr.message?.includes('429')

        if (!isQuota) throw geminiErr
        
        console.log('Gemini quota, using Groq for improve...')
        usedGroq = true

        if (isPdf && extractedText === 'PDF_NATIVE') {
          extractedText = `CV for ${targetRole} position`
        }

        const GroqSDK = (await import('groq-sdk')).default
        const groq = new GroqSDK({ apiKey: process.env.GROQ_API_KEY || '' })

        const groqPrompt = improvePrompt.replace('PDF_NATIVE', extractedText)

        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Return ONLY valid JSON. No markdown. No explanation. Start with { and end with }.'
            },
            { role: 'user', content: groqPrompt }
          ],
          temperature: 0.1,
          max_tokens: 1200,
          response_format: { type: 'json_object' }
        })

        improvedCVText = response.choices[0].message.content || ''
        console.log('✅ Groq improve OK')
      }

      // STEP 4: Parse response
      console.log('Improve response preview:', improvedCVText.substring(0, 200))

      let improvedCV: any
      const { parseAIResponse } = await import('./services/aiService.ts')
      try {
        improvedCV = parseAIResponse(improvedCVText)
      } catch (err: any) {
        console.error('JSON Parse failed for improved CV')
        throw new Error('AI returned invalid format')
      }

      // STEP 5: Calculate new scores
      const newKeywords = [
        ...(improvedCV.skills || []),
        ...(improvedCV.addedKeywords || [])
      ].map((k: string) => k.toLowerCase())
      
      const matchedNew = roleKeywords.filter(k =>
        newKeywords.some((nk: string) => nk.includes(k.toLowerCase()) || k.toLowerCase().includes(nk))
      )

      const newAtsScore = Math.round((matchedNew.length / roleKeywords.length) * 100)
      const newOverall = Math.min(100, Math.round(newAtsScore * 0.3 + 70 * 0.7))
      const newInterviewChance = Math.round(newOverall * 0.85)

      // STEP 6: Return result
      return res.json({
        success: true,
        improvedCV,
        newAnalysis: {
          overallScore: newOverall,
          atsScore: newAtsScore,
          interviewChance: newInterviewChance,
          skillDistribution: {
            content: 80,
            experience: 75,
            education: 70,
            technical: newAtsScore,
            impact: improvedCV.improvements?.length > 2 ? 80 : 60,
            keywords: newAtsScore
          },
          strengths: [
            'CV rewritten with strong action verbs',
            'Keywords optimized for ' + targetRole,
            'Professional summary enhanced'
          ],
          weaknesses: [],
          sections: {
            summary: { score: 80, status: 'strong', feedback: 'Improved summary' },
            experience: { score: 75, status: 'strong', feedback: 'Strong bullet points' },
            education: { score: 70, status: 'strong', feedback: 'Education preserved' },
            skills: { score: newAtsScore, status: newAtsScore > 60 ? 'strong' : 'weak', feedback: 'Skills optimized' }
          },
          matchedKeywords: matchedNew,
          missingKeywords: roleKeywords.filter(k => !matchedNew.includes(k)).slice(0, 5)
        },
        usedFallback: usedGroq
      })

    } catch (error: any) {
      console.error('IMPROVE ERROR:', error.message)
      
      if (error.status === 429 || error.message?.includes('quota')) {
        return res.status(429).json({ success: false, message: 'Rate limit hit. Wait 1 min and retry.' })
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Improvement failed'
      })
    }
  })
