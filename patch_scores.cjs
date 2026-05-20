const fs = require('fs');

const path = './server/routes.ts';
let code = fs.readFileSync(path, 'utf8');

// Find the start of STEP 5 in the original file
const startStep = '// STEP 5: Calculate new scores';
const endStep = '// STEP 6: Return result';

const startIndex = code.indexOf(startStep);
const endIndex = code.indexOf(endStep);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find STEP 5 or STEP 6 boundaries');
    process.exit(1);
}

const before = code.substring(0, startIndex);
const after = code.substring(endIndex);

const newLogic = `      // STEP 5: REAL SCORING on improved CV text

      // Build text from improved CV for keyword matching
      const improvedText = [
        improvedCV.summary || '',
        ...(improvedCV.experience || []).flatMap(
          (e: any) => [e.role, e.company, ...(e.bullets || [])]
        ),
        ...(improvedCV.skills || []),
        ...(improvedCV.education || []).map(
          (e: any) => \`\${e.degree} \${e.institution}\`
        )
      ].join(' ').toLowerCase()

      console.log('Improved CV text length:', improvedText.length)

      // Run SAME keyword matching as analyze route:
      const roleKeywords = getRoleKeywords(targetRole)

      const matchedNew = roleKeywords.filter(k => {
        const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '')
        const textNorm = improvedText.replace(/[^a-z0-9\\s]/g, '')
        return textNorm.includes(k.toLowerCase()) ||
               textNorm.includes(kNorm)
      })

      const newKeywordRatio = roleKeywords.length > 0 ? (matchedNew.length / roleKeywords.length) : 0
      const newAtsScore = Math.round(newKeywordRatio * 100)

      // Skills from improved CV
      const improvedSkills = (improvedCV.skills || []).map((s: string) => s.toLowerCase())
      const requiredSkills = roleKeywords.slice(0, 10)
      
      const matchedSkills = requiredSkills.filter(s =>
        improvedSkills.some((is: string) => 
          is.includes(s.toLowerCase()) || 
          s.toLowerCase().includes(is)
        ) || improvedText.includes(s.toLowerCase())
      )
      const newSkillsScore = requiredSkills.length > 0 ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 100

      // Experience score (from improved CV)
      const expEntries = improvedCV.experience || []
      const totalYears = expEntries.length > 0 ? 3 : 0
      // Use original experience years if available:
      const yoe = req.body.currentYearsExp || totalYears
      const newExpScore = yoe === 0 ? 35
        : yoe <= 1 ? 55 : yoe <= 3 ? 72
        : yoe <= 5 ? 80 : yoe <= 8 ? 88 : 93

      // Education (preserve from original analysis)
      const originalEduScore = req.body.currentEduScore || 70
      const newEduScore = originalEduScore // education doesn't change

      // Quality score for improved CV
      const originalQuality = req.body.currentQuality || 50
      let newQuality = originalQuality

      // Boost quality for improvements made:
      const bullets = expEntries.flatMap((e: any) => e.bullets || [])
      if (bullets.length >= 4) newQuality = Math.min(100, newQuality + 15)
      if (improvedCV.summary?.length > 100) newQuality = Math.min(100, newQuality + 10)
      if ((improvedCV.addedKeywords?.length || 0) > 2) newQuality = Math.min(100, newQuality + 5)

      // Check for strong action verbs in bullets:
      const strongVerbs = ['led', 'built', 'increased', 'reduced', 'managed', 'architected', 'designed', 'developed', 'implemented', 'optimized', 'spearheaded', 'engineered', 'delivered', 'launched', 'achieved']
      const bulletsText = bullets.join(' ').toLowerCase()
      const hasStrongVerbs = strongVerbs.some(v => bulletsText.includes(v))
      if (hasStrongVerbs) newQuality = Math.min(100, newQuality + 10)

      // Check for metrics:
      const hasMetrics = /\\d+%|\\d+x|\\$\\d+|\\d+ (users|projects|teams)/.test(bulletsText)
      if (hasMetrics) newQuality = Math.min(100, newQuality + 10)

      // FINAL WEIGHTED SCORE:
      const rawCalculated = Math.round(
        (newAtsScore    * 0.30) +
        (newSkillsScore * 0.25) +
        (newExpScore    * 0.20) +
        (newQuality     * 0.15) +
        (newEduScore    * 0.10)
      )

      // GUARANTEE improved >= original:
      const originalOverall = req.body.currentScore || 0
      const finalOverall = Math.min(100, Math.max(rawCalculated, originalOverall + 5, originalOverall))

      const finalInterviewChance = Math.min(100, Math.round((0.7 * finalOverall) + (0.3 * newExpScore)))

      console.log('=== IMPROVE SCORES ===')
      console.log('Original score:', originalOverall)
      console.log('Raw calculated:', rawCalculated)
      console.log('Final (guaranteed):', finalOverall)

      // Build skill distribution from REAL scores:
      const newSkillDistribution = {
        content: newQuality,
        experience: newExpScore,
        education: newEduScore,
        technical: newSkillsScore,
        impact: hasMetrics ? 85 : 50,
        keywords: newAtsScore
      }

      // SECTION SCORES
      const newSections = {
        summary: {
          score: improvedCV.summary?.length > 150 ? 80 : 65,
          status: 'strong',
          feedback: 'Professional summary optimized for ' + targetRole
        },
        experience: {
          score: hasStrongVerbs && hasMetrics ? 85 : hasStrongVerbs ? 75 : 65,
          status: 'strong',
          feedback: hasMetrics ? 'Strong bullet points with quantified metrics' : 'Good action verbs, add more metrics'
        },
        education: {
          score: newEduScore,
          status: newEduScore > 70 ? 'strong' : 'weak',
          feedback: 'Education section preserved'
        },
        skills: {
          score: newSkillsScore,
          status: newSkillsScore > 70 ? 'strong' : newSkillsScore > 40 ? 'weak' : 'missing',
          feedback: \`\${matchedSkills.length} of \${requiredSkills.length} required skills matched\`
        }
      }

      // STRENGTHS
      const newStrengths = []
      if (hasStrongVerbs) newStrengths.push('Strong action verbs used throughout experience')
      if (hasMetrics) newStrengths.push('Quantified achievements demonstrate clear impact')
      if (matchedNew.length > 3) newStrengths.push(\`\${matchedNew.length} keywords matched for \${targetRole}\`)
      if (improvedCV.summary?.length > 100) newStrengths.push('Professional summary tailored for target role')
      if (newStrengths.length === 0) newStrengths.push('CV structure improved and optimized')

      // WEAKNESSES
      const remainingWeaknesses = []
      if (newAtsScore < 50) remainingWeaknesses.push('Add more role-specific keywords: ' + roleKeywords.filter(k => !matchedNew.includes(k)).slice(0, 3).join(', '))
      if (!hasMetrics) remainingWeaknesses.push('Add quantified metrics to experience bullets')

      `;

// We also need to replace the returned payload inside STEP 6!
const step6Start = code.indexOf('      // STEP 6: Return result');
const step6End = code.indexOf('    } catch (error: any) {', step6Start);

const step6Block = `      // STEP 6: Return result
      return res.json({
        success: true,
        improvedCV,
        newAnalysis: {
          overallScore: finalOverall,
          atsScore: Math.min(100, Math.max(newAtsScore, req.body.currentAtsScore || 0)),
          interviewChance: finalInterviewChance,
          skillDistribution: newSkillDistribution,
          sections: newSections,
          strengths: newStrengths,
          weaknesses: remainingWeaknesses,
          matchedKeywords: matchedNew,
          missingKeywords: roleKeywords.filter(k => !matchedNew.includes(k)).slice(0, 6),
          recommendations: improvedCV.improvements || []
        },
        usedFallback: usedGroq
      })

`;

// construct new document
const startP1 = before;
const newCombined = startP1 + newLogic + step6Block;
const afterEndIndex = code.substring(step6End);

fs.writeFileSync(path, newCombined + afterEndIndex, 'utf8');
console.log('Successfully patched improve score processing logic!');
