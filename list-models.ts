import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

async function run() {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(data.models.map((m: any) => m.name).join("\n"));
  } catch (err) {
    console.error(err);
  }
}

run();
