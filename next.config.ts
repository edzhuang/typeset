import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  webpack: (config, { dev }) => {
    if (dev) {
      // Suppress webpack cache serialization warnings for large strings (e.g., from shiki themes)
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        level: "error",
      };
    }
    return config;
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
