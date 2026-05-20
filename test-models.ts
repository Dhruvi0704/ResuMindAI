import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODELS_TO_TEST = [
    "gemini-pro",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
];

async function testModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found");
        return;
    }

    console.log(`✅ API Key: ${apiKey.substring(0, 10)}...\n`);
    console.log("🧪 Testing models...\n");

    const genAI = new GoogleGenerativeAI(apiKey);
    const workingModels: string[] = [];

    for (const modelName of MODELS_TO_TEST) {
        try {
            console.log(`Testing: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'Working' in one word.");
            const response = await result.response;
            const text = response.text();

            console.log(`   ✅ SUCCESS! Response: "${text.trim()}"\n`);
            workingModels.push(modelName);
        } catch (error: any) {
            console.log(`   ❌ FAILED: ${error.message?.substring(0, 80) || "Unknown error"}\n`);
        }
    }

    console.log("\n" + "=".repeat(60));
    if (workingModels.length > 0) {
        console.log(`\n✅ WORKING MODELS (${workingModels.length}):\n`);
        workingModels.forEach(m => console.log(`   - ${m}`));
        console.log(`\n💡 RECOMMENDED: Use "${workingModels[0]}" in your code\n`);
    } else {
        console.log("\n❌ No working models found. Check your API key.\n");
    }
    console.log("=".repeat(60) + "\n");
}

testModels();
