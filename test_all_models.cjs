require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("Testing API Key:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");

  const models = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro'
  ];

  for (const m of models) {
    try {
      console.log(`\nTesting ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("hello");
      console.log(`SUCCESS for ${m}:`, result.response.text());
    } catch (err) {
      console.log(`FAILED for ${m}:`, err.status || err.message);
    }
  }
}
checkModels();
