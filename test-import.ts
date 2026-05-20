import { connectDB } from "./server/db.ts";
import mongoose from "mongoose";
import { registerRoutes } from "./server/routes.ts";
import { setupVite, serveStatic, log } from "./server/vite.ts";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";
import { setupAuth } from "./server/passport.ts";

console.log("Imports successful");
