
import 'dotenv/config';

console.log("MONGO_URI from .env:", process.env.MONGO_URI);
console.log("MONGODB_URI from env:", process.env.MONGODB_URI);

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/resumind";
console.log("Selected URI:", uri);
