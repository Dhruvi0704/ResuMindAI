import { getGeminiModel } from './server/services/geminiService.ts';

async function test() {
  try {
    const model = getGeminiModel();
    console.log("Model initialized. Calling generateContent...");
    const result = await model.generateContent("Say hello");
    console.log("Result:", result.response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
