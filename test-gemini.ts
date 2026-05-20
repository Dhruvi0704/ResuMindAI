import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No API key found in .env");
  process.exit(1);
}

console.log("Testing with API Key:", apiKey.substring(0, 10) + "...");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function test() {
  try {
    console.log("Sending test request to gemini-2.5-flash...");
    const result = await model.generateContent("Say 'hello' in exactly one word. Do not say anything else.");
    console.log("Success! Response:", result.response.text());
  } catch (error: any) {
    console.error("Test failed!");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    if (error.response) {
      console.error("Response Details:", JSON.stringify(error.response, null, 2));
    }
  }
}

test();
