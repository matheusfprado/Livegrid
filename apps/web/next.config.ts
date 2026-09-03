import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@livegrid/ui", "@livegrid/config", "@livegrid/types", "@livegrid/validation"],
};

export default nextConfig;
