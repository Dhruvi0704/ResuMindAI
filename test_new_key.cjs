const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyDGczyGXZN4oNgVFN_gshc0nn1HocxLKtY');

async function test() {
  console.log('Testing models...');
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite-001', 'gemini-1.5-flash-8b', 'gemini-pro', 'gemini-1.5-flash'];
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      await model.generateContent('hi');
      console.log(`${modelName}: SUCCESS`);
    } catch(e) {
      console.log(`${modelName}: FAIL (${e.status})`);
    }
  }
}
test();
