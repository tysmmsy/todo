/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	experimental: {
		middlewarePrefetch: 'strict',
	},
}

export default nextConfig
