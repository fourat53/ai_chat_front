import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	turbopack: {
		resolveAlias: {
			"emf-converter": "./lib/stubs/emf-converter.ts",
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
		],
	},
};

export default nextConfig;
