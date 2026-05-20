const fs = require('fs');
const content = fs.readFileSync('server/routes.ts', 'utf8');

const analyzeStart = content.indexOf("app.post('/api/cv/analyze', async (req, res) => {");
const improveStart = content.indexOf("app.post('/api/cv/improve', async (req, res) => {");

if (analyzeStart === -1 || improveStart === -1) {
  console.error("Could not find route boundaries");
  process.exit(1);
}

const newRoute = `app.post('/api/cv/analyze', async (req, res) => {
    console.log('=== ANALYZE CV CALLED ===')

    try {
      const { fileBase64, fileType, fileName, targetRole, userId } = req.body

      if (!fileBase64) return res.status(400).json({ success: false, message: 'No file data received' })
      if (!targetRole) return res.status(400).json({ success: false, message: 'Target role is required' })
      if (!process.env.GEMINI_API_KEY) return res.status(500).json({ success: false, message: 'Gemini API key not configured' })

      const mimeType = fileType?.includes('wordprocessingml')
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf'

      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      const result = await model.generateContent([
        {
          inlineData: { mimeType: mimeType, data: fileBase64 }
        },
        {
          text: \`Read this CV and extract structured data.
Return ONLY valid JSON (no markdown, no backticks):
{
  "name": "string",
  "totalYearsExperience": number,
  "skills": ["skill1", "skill2"],
  "educationLevel": "phd|masters|bachelors|diploma|none",
  "hasQuantifiedAchievements": boolean,
  "bulletPointCount": number,
  "hasSummary": boolean,
  "hasEducation": boolean,
  "hasExperience": boolean,
  "hasSkills": boolean,
  "actionVerbsUsed": ["verb1", "verb2"],
  "weakVerbs": ["helped", "worked on", "assisted"],
  "jobTitles": ["title1", "title2"],
  "companies": ["company1"],
  "keywords": ["keyword1", "keyword2"],
  "missingKeywords": ["missing1", "missing2"],
  "sectionFeedback": {
    "summary": "specific feedback",
    "experience": "specific feedback", 
    "education": "specific feedback",
    "skills": "specific feedback"
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["rec1", "rec2", "rec3"]
}\`
        }
      ])

      const responseText = result.response.text()
      const cleanJson = responseText.replace(/\\\`\\\`\\\`json/gi, '').replace(/\\\`\\\`\\\`/g, '').trim()

      let extractedData
      try {
        extractedData = JSON.parse(cleanJson)
      } catch {
        const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/)
        if (!jsonMatch) throw new Error('Gemini returned invalid JSON format')
        extractedData = JSON.parse(jsonMatch[0])
      }

      // STEP 2: CALCULATE SCORES using REAL formulas
      const { getKeywordsForRole, getRequiredSkillsForRole, getDomainKeywords, getTFIDFScore } = await import('./lib/scoringEngine.js');
      
      const cvKeywords = (extractedData.keywords || []).map((k:string) => k.toLowerCase())
      const cvSkills = (extractedData.skills || []).map((s:string) => s.toLowerCase())
      
      const targetRoleKeywords = getKeywordsForRole(targetRole).map((k:string) => k.toLowerCase())
      const matchedKeywords = cvKeywords.filter((k:string) => targetRoleKeywords.includes(k))
      
      const keywordMatchRatio = targetRoleKeywords.length > 0 ? (matchedKeywords.length / targetRoleKeywords.length) : 1
      const semanticScore = await getTFIDFScore(fileBase64.substring(0, 5000), targetRole)
      
      const atsScore = Math.round((0.7 * semanticScore) + (0.3 * keywordMatchRatio * 100))

      const requiredSkills = getRequiredSkillsForRole(targetRole).map((s:string) => s.toLowerCase())
      const matchedSkills = cvSkills.filter((s:string) => requiredSkills.some((r:string) => s.includes(r)))
      const skillsScore = requiredSkills.length > 0 ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 100

      const expScore = (() => {
        const yoe = extractedData.totalYearsExperience || 0
        if (yoe === 0) return 35
        if (yoe <= 1) return 55
        if (yoe <= 2) return 70
        if (yoe <= 4) return 80
        if (yoe <= 7) return 88
        if (yoe <= 10) return 93
        return 97
      })()

      const eduScore = (() => {
        switch(extractedData.educationLevel?.toLowerCase()) {
          case 'phd': return 100
          case 'masters': return 85
          case 'bachelors': return 70
          case 'diploma': return 50
          default: return 30
        }
      })()

      let qualityScore = 100
      if (!extractedData.hasSummary) qualityScore -= 15
      if ((extractedData.bulletPointCount || 0) < 3) qualityScore -= 15
      if (!extractedData.hasQuantifiedAchievements) qualityScore -= 10
      if ((extractedData.weakVerbs || []).length > 3) qualityScore -= 10
      if (!extractedData.hasSkills) qualityScore -= 10
      qualityScore = Math.max(0, qualityScore)

      const domainKeywords = getDomainKeywords(targetRole).map((k:string) => k.toLowerCase())
      const domainMatched = cvKeywords.filter((k:string) => domainKeywords.includes(k))
      const domainMatchPct = domainKeywords.length > 0 ? (domainMatched.length / domainKeywords.length) * 100 : 100

      let penaltyMultiplier = 1
      let penaltyApplied = false
      if (domainMatchPct < 20) {
        penaltyMultiplier = 0  
        penaltyApplied = true
      } else if (domainMatchPct < 30) {
        penaltyMultiplier = 0.45
        penaltyApplied = true
      }

      const sectionScores = {
        summary: extractedData.hasSummary ? Math.min(100, 60 + (extractedData.hasQuantifiedAchievements ? 20 : 0) + ((extractedData.bulletPointCount||0) > 2 ? 20 : 0)) : 0,
        experience: Math.round(expScore * penaltyMultiplier),
        education: eduScore,
        skills: Math.round(skillsScore * penaltyMultiplier)
      }

      const candidateScore = Math.round(
        (atsScore * 0.30) +
        (skillsScore * 0.25) +
        (expScore * 0.20) +
        (qualityScore * 0.15) +
        (eduScore * 0.10)
      ) * penaltyMultiplier

      const interviewChance = Math.round((0.7 * candidateScore) + (0.3 * expScore))
      const offerProbability = Math.round(interviewChance * 0.7)
      const overallScore = Math.min(100, Math.round(candidateScore))

      const analysis = {
        overallScore,
        atsScore: Math.round(atsScore * penaltyMultiplier),
        skillsScore: Math.round(skillsScore * penaltyMultiplier),
        experienceScore: Math.round(expScore),
        educationScore: eduScore,
        qualityScore,
        domainMatchPct: Math.round(domainMatchPct),
        penaltyApplied,
        interviewChance,
        offerProbability,
        sections: {
          summary: {
            score: sectionScores.summary,
            status: sectionScores.summary > 70 ? 'strong' : sectionScores.summary > 40 ? 'weak' : 'missing',
            feedback: extractedData.sectionFeedback?.summary || "No specific feedback."
          },
          experience: {
            score: sectionScores.experience,
            status: sectionScores.experience > 70 ? 'strong' : sectionScores.experience > 40 ? 'weak' : 'missing',
            feedback: extractedData.sectionFeedback?.experience || "No specific feedback."
          },
          education: {
            score: sectionScores.education,
            status: sectionScores.education > 70 ? 'strong' : sectionScores.education > 40 ? 'weak' : 'missing',
            feedback: extractedData.sectionFeedback?.education || "No specific feedback."
          },
          skills: {
            score: sectionScores.skills,
            status: sectionScores.skills > 70 ? 'strong' : sectionScores.skills > 40 ? 'weak' : 'missing',
            feedback: extractedData.sectionFeedback?.skills || "No specific feedback."
          }
        },
        strengths: extractedData.strengths || [],
        weaknesses: extractedData.weaknesses || [],
        missingKeywords: targetRoleKeywords.filter((k:string) => !cvKeywords.includes(k)).slice(0, 8),
        recommendations: extractedData.recommendations || [],
        matchedKeywords,
        skillsMatched: matchedSkills,
        skillsRequired: requiredSkills
      }

      if (req.isAuthenticated()) {
        const authUserId = (req.user as any).id;
        try {
          await StorageService.saveAnalysis(authUserId, {
            fileName: fileName || "upload",
            targetRole,
            overallScore: analysis.overallScore,
            atsScore: analysis.atsScore,
            interviewChance: analysis.interviewChance,
            analysisData: analysis,
            extractedText: ''
          });
        } catch(dbErr: any) { }
      }

      return res.json({ success: true, analysis })

    } catch (error: any) {
      console.error('=== ANALYZE ERROR ===', error.message)
      if (error.status === 429 || error.message?.includes('RATE_LIMIT')) {
        return res.status(429).json({ success: false, message: 'Gemini rating limit hit.' })
      }
      return res.status(500).json({ success: false, message: error.message || 'Analysis failed' })
    }
  });

  `;

const newContent = content.slice(0, analyzeStart) + newRoute + content.slice(improveStart);
fs.writeFileSync('server/routes.ts', newContent);
console.log("Successfully patched analyze route");
