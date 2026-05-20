import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testAtlas() {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        console.log("Testing Connection to:", uri?.substring(0, 30) + "...");

        if (!uri) throw new Error("No URI found in env");

        await mongoose.connect(uri);
        console.log("✅ SUCCESS: Connected to Cloud MongoDB!");
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ FAILED:", error);
        process.exit(1);
    }
}
testAtlas();
