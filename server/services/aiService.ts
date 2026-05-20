import { GoogleGenerativeAI } from '@google/generative-ai';

export const parseAIResponse = (rawText: string): any => {
  console.log('=== RAW AI RESPONSE ===')
  console.log('Length:', rawText?.length)
  console.log('First 300 chars:', rawText?.substring(0, 300))
  console.log('Last 100 chars:', rawText?.substring(rawText.length - 100))

  if (!rawText || rawText.trim() === '') {
    throw new Error('AI returned empty response')
  }

  let text = rawText.trim()

  // STEP 1: Remove ALL markdown variations
  text = text.replace(/^```json\s*/i, '')
  text = text.replace(/^```\s*/i, '')
  text = text.replace(/\s*```$/i, '')
  text = text.replace(/```json/gi, '')
  text = text.replace(/```/g, '')
  text = text.trim()

  // STEP 2: Try direct parse first
  try {
    return JSON.parse(text)
  } catch (e) {}

  // STEP 3: Extract JSON between first { and last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  
  if (start !== -1 && end !== -1 && end > start) {
    const extracted = text.substring(start, end + 1)
    try {
      return JSON.parse(extracted)
    } catch (e) {}
    
    // STEP 4: Fix common issues in extracted JSON
    let fixed = extracted
    
    // Fix trailing commas
    fixed = fixed.replace(/,\s*}/g, '}')
    fixed = fixed.replace(/,\s*]/g, ']')
    
    // Fix Python booleans
    fixed = fixed.replace(/:\s*True\b/g, ': true')
    fixed = fixed.replace(/:\s*False\b/g, ': false')
    fixed = fixed.replace(/:\s*None\b/g, ': null')
    
    // Fix unescaped quotes in strings
    // Match string values and escape internal quotes
    fixed = fixed.replace(
      /:\s*"((?:[^"\\]|\\.)*)"/g,
      (match, p1) => {
        // Don't double-escape already escaped quotes
        const cleaned = p1
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\t/g, ' ')
        return `: "${cleaned}"`
      }
    )
    
    try {
      return JSON.parse(fixed)
    } catch (e) {
      console.error('All parse attempts failed')
      console.error('Fixed text:', fixed.substring(0, 500))
      throw new Error(`JSON parse failed: ${(e as Error).message}`)
    }
  }

  throw new Error('No valid JSON found in AI response')
}

export const callAI = async (
  prompt: string,
  fileBase64?: string,
  mimeType?: string
): Promise<string> => {

  // TRY GEMINI FIRST
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash', // Updated to 2.5 flash as we discovered earlier
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 8000,
          temperature: 0.1
        }
      })

      const parts: any[] = []
      if (fileBase64 && mimeType === 'application/pdf') {
        parts.push({ 
          inlineData: { mimeType, data: fileBase64 } 
        })
      }
      parts.push({ text: prompt })

      const result = await model.generateContent(parts)
      const text = result.response.text()
      console.log('✅ Gemini OK, length:', text.length)
      return text

    } catch (err: any) {
      const isQuota = err.status === 429 ||
        err.message?.includes('quota') ||
        err.message?.includes('429') ||
        err.message?.includes('Too Many')
      
      if (!isQuota) {
        console.error('Gemini non-quota error:', err.message)
        throw err
      }
      console.log('Gemini quota hit, trying Groq...')
    }
  }

  // GROQ FALLBACK
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      'Gemini rate limit hit. Add GROQ_API_KEY to .env for automatic fallback. Get free key at console.groq.com'
    )
  }

  try {
    const Groq = (await import('groq-sdk')).default
    const groq = new Groq({ 
      apiKey: process.env.GROQ_API_KEY 
    })

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Return ONLY a valid JSON object. No markdown. No explanation. Start with { end with }.'
        },
        {
          role: 'user',
          content: prompt + '\n\nReturn ONLY the JSON. Start with {.'
        }
      ],
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    })

    const text = response.choices[0].message.content || ''
    console.log('✅ Groq OK, length:', text.length)
    console.log('Groq preview:', text.substring(0, 200))
    return text

  } catch (groqErr: any) {
    console.error('Groq error:', groqErr.message)
    throw new Error(`Both Gemini and Groq failed. Groq error: ${groqErr.message}`)
  }
}
