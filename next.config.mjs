/** @type {import('next').NextConfig} */
const nextConfig = {
  // A self-contained server for the Docker image (deploy/).
  output: "standalone",
  // The site uses plain <img>; without this the /_next/image endpoint stays exposed for nothing.
  images: { unoptimized: true },
};

export default nextConfig;
