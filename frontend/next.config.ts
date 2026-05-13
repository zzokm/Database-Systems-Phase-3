import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from the repository root `.env`
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const nextConfig: NextConfig = {
  // Smaller Docker images: trace only server deps into `.next/standalone` (see frontend/Dockerfile).
  output: "standalone",
};

export default nextConfig;
