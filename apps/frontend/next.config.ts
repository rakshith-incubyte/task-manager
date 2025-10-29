import type { NextConfig } from "next";

const isWindows = process.platform === 'win32'

const nextConfig: NextConfig = {
  ...(isWindows ? {} : { output: 'standalone' }),
};

export default nextConfig;
