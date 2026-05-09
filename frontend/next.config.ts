import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from the repository root `.env`
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
