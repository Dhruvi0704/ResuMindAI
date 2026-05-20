/// <reference types="node" />
import "dotenv/config";
import https from "https";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Checking available models...");

https.get(url, (res) => {
    let data = "";

    res.on("data", (chunk) => {
        data += chunk;
    });

    res.on("end", () => {
        if (res.statusCode !== 200) {
            console.error(`HTTP Error: ${res.statusCode}`);
            console.error(data);
        } else {
            try {
                const json = JSON.parse(data);
                if (json.models) {
                    console.log("\n--- AVAILABLE MODELS (Top 5) ---");
                    const validModels = json.models
                        .map((m: any) => m.name.replace("models/", ""))
                        .filter((name: string) => name.includes("flash") || name.includes("pro"))
                        .slice(0, 5);

                    if (validModels.length > 0) {
                        validModels.forEach((name: string) => console.log(name));
                    } else {
                        console.log("No 'flash' or 'pro' models found.");
                    }
                    console.log("------------------------------\n");
                } else {
                    console.log("No models found.");
                }
            } catch (e) {
                console.error("JSON Parse Error");
            }
        }
    });

}).on("error", (err) => {
    console.error("Network Error:", err.message);
});
