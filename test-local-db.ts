
import mongoose from 'mongoose';

const uri = "mongodb://127.0.0.1:27017/resumind";

console.log("Testing connection to:", uri);

mongoose.connect(uri)
    .then(() => {
        console.log("✅ Successfully connected to LOCAL MongoDB!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Local Connection failed:", err);
        process.exit(1);
    });
