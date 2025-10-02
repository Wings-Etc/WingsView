// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack: (config) => {
    // Hard-define @ → <repo>/src so webpack resolves it no matter what
    config.resolve.alias["@" ] = path.resolve(__dirname, "src");
    // Ensure common extensions are considered
    if (!config.resolve.extensions.includes(".ts")) config.resolve.extensions.push(".ts");
    if (!config.resolve.extensions.includes(".tsx")) config.resolve.extensions.push(".tsx");
    if (!config.resolve.extensions.includes(".js")) config.resolve.extensions.push(".js");
    if (!config.resolve.extensions.includes(".jsx")) config.resolve.extensions.push(".jsx");
    return config;
  },
};

module.exports = nextConfig;
