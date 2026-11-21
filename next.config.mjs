const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ...(process.env.NODE_ENV === 'production' ? [{key:'Strict-Transport-Security',value:'max-age=31536000'}] : []),
      ],
    },{source:'/api/admin/:path*',headers:[{key:'Cache-Control',value:'private, no-store'}]},{source:'/api/auth/:path*',headers:[{key:'Cache-Control',value:'private, no-store'}]}];
  },
};

export default nextConfig;
