import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  // Mongo connection status map
  const dbState = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        service: "API server",
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(), // seconds
        environment: process.env.NODE_ENV || "development",
        database: {
          status: dbState[mongoose.connection.readyState] || "unknown",
        },
      },
      "Health check successful"
    )
  );
});

export { healthcheck };
