/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config, { isServer }) => {
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				path: false,
				child_process: false,
			};
		}
		return config;
	},
	experimental: {
		serverComponentsExternalPackages: ["@google-cloud/storage"],
	},
	output: "standalone",
};

module.exports = nextConfig;
