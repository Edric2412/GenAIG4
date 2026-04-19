/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000, // Check for changes every second
      aggregateTimeout: 300, // Delay rebuild after first change
      ignored: [
        '**/node_modules',
        '**/.next',
        '**/backend/**',
        '**/.git/**',
      ],
    };
    return config;
  },
}

module.exports = nextConfig
