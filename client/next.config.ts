import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  // This creates a self-contained build in .next/standalone
  output: "standalone",
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
