import dotenv from "dotenv";
import mongoose from "mongoose";
import { app } from "./app.js";   // ✅ IMPORT REAL APP
import { db_name } from "./constants.js";

dotenv.config({
  path: "./env"
});

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`);

    app.listen(process.env.PORT || 8000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
})();
