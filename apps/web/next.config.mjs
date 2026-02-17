/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ggaba/ui", "@ggaba/lib", "@ggaba/db"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
      },
    ],
  },
};

export default nextConfig;
