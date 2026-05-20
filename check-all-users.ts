import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const User = mongoose.model('User', userSchema);

async function checkUsers() {
    try {
        const uri = "mongodb://127.0.0.1:27017/resumind";
        console.log("Connecting to Localhost:", uri);

        await mongoose.connect(uri);
        console.log("✅ Connected. Querying users...");

        const users = await User.find({});
        console.log(`\nFound ${users.length} users in database:`);
        console.log("-".repeat(50));

        if (users.length === 0) {
            console.log("⚠️  NO USERS FOUND. The database is empty.");
            console.log("The user MUST register again.");
        } else {
            users.forEach((u, i) => {
                console.log(`${i + 1}. Username: '${u.username}'`);
                console.log(`   Email:    '${u.email}'`);
                console.log(`   ID:       ${u._id}`);
            });
        }
        console.log("-".repeat(50));
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

checkUsers();
