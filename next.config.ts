import type { NextConfig } from "next";

// v4 — narrow the image-loading surface to exactly the patterns the app uses.
// Every Wikimedia photo in data/wiki-photos.json lives under /wikipedia/commons/
// on upload.wikimedia.org; the three other hosts that were previously listed
// (images.unsplash.com, picsum.photos, commons.wikimedia.org) are not referenced
// by any current code path and were removed to shrink the trust boundary.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },

  async headers() {
    // Substantive lockdown is in connect-src + img-src + frame-ancestors.
    // 'unsafe-inline' on scripts/styles stays for now because Tailwind/Next inject
    // inline runtime; tightening that further is a separate hash-pinning pass.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://upload.wikimedia.org",
      "font-src 'self' data:",
      "connect-src 'self' https://api.open-meteo.com",
      "media-src 'self'",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
