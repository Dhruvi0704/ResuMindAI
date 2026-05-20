
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/resumind";

console.log("Testing connection to:", uri.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(uri)
    .then(() => {
        console.log("✅ Successfully connected to MongoDB!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Connection failed:", err);
        process.exit(1);
    });
