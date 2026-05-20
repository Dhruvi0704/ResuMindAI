import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

const GEMINI_MODEL = 'gemini-2.5-flash'

let genAI: GoogleGenerativeAI | null = null

export const getGeminiModel = () => {
  dotenv.config({ override: true }) // Reloading API key payload natively
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set in .env')
  }
  
  // Re-initialize genAI if the key changed dynamically
  genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  )
  
  return genAI.getGenerativeModel({ 
    model: GEMINI_MODEL,
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.1
    }
  })
}

export const GEMINI_MODEL_NAME = GEMINI_MODEL

