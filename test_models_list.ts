import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
async function main() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.models) {
            console.log("AVAILABLE MODELS:");
            for (const m of data.models) {
                console.log(m.name);
            }
        } else {
            console.log(data);
        }
    } catch (e) {
        console.error(e);
    }
}
main();
