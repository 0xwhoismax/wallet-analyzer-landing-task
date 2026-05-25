// import { withSentryConfig } from '@sentry/nextjs';
import 'dotenv/config';
import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

const isDev = process.env.NODE_ENV === 'development';
const deployId = process.env.NEXT_PUBLIC_DEPLOY_ID
  || process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.RAILWAY_GIT_COMMIT_SHA
  || process.env.RAILWAY_DEPLOYMENT_ID
  || 'local';

// Build CSP value with required Privy directives and allow Convex endpoint
// We include both https and wss variants of the Convex deployment URL
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? '';
let convexConnectSrc = '';
try {
  if (convexUrl) {
    const url = new URL(convexUrl);
    const origin = `${url.protocol}//${url.host}`;
    const wsOrigin = origin.replace(/^http/, 'ws');
    convexConnectSrc = ` ${origin} ${wsOrigin}`;
  }
} catch {
  // ignore malformed env; we prefer a strict CSP rather than guessing
}

// Allow bubblemap API URL for holder distribution analysis
const bubblemapUrl = process.env.NEXT_PUBLIC_BUBBLEMAP_API_URL ?? '';
let bubblemapConnectSrc = '';
try {
  if (bubblemapUrl) {
    const url = new URL(bubblemapUrl);
    bubblemapConnectSrc = ` ${url.protocol}//${url.host}`;
  }
} catch {
  // ignore malformed env
}

// Allow ws-worker URL for price streaming
const wsWorkerUrl = process.env.NEXT_PUBLIC_WS_WORKER_URL ?? '';
let wsWorkerConnectSrc = '';
try {
  if (wsWorkerUrl) {
    const url = new URL(wsWorkerUrl);
    wsWorkerConnectSrc = ` ${url.protocol}//${url.host}`;
  }
} catch {
  // ignore
}

let csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https://*.convex.cloud https://*.convex.site https://cloud.smoothie.fun https://video.twimg.com",
  "font-src 'self' https://fonts.reown.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "child-src 'self' https://auth.privy.io https://*.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://privy.smoothie.fun https://privy.lightterminal.io https://apple.com https://google.com https://pay.google.com https://www.apple.com https://api.moonpay.com https://*.moonpay.com blob:",
  "frame-src 'self' https://auth.privy.io https://*.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com https://privy.smoothie.fun https://privy.lightterminal.io https://apple.com https://google.com https://pay.google.com https://www.apple.com https://api.moonpay.com https://*.moonpay.com blob: data:",
  "connect-src 'self' https://auth.privy.io https://*.privy.io wss://*.privy.io https://*.privy.systems wss://*.privy.systems https://privy.smoothie.fun wss://privy.smoothie.fun https://privy.lightterminal.io wss://privy.lightterminal.io https://cloud.smoothie.fun wss://cloud.smoothie.fun https://actions.smoothie.fun https://relay.walletconnect.com https://relay.walletconnect.org https://www.walletlink.org wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://api.web3modal.org https://pulse.walletconnect.org https://api.vxtwitter.com https://api.fxtwitter.com https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://api.testnet.solana.com https://*.helius-rpc.com wss://*.helius-rpc.com https://*.quiknode.pro https://rpc.ankr.com https://api.dexscreener.com https://pbs.twimg.com https://*.publicnode.com https://forno.celo.org https://api.node.glif.io https://api.calibration.node.glif.io https://rpc.mainnet.lukso.network https://rpc.linea.build https://api.avax.network https://rpc.zora.energy https://rpc.redstonechain.com https://rpc.garnetchain.com https://mainnet.base.org https://moonraker.jup.ag https://quote-api.jup.ag https://apple.com https://google.com https://pay.google.com https://www.apple.com https://api.moonpay.com https://*.moonpay.com https://api.gopluslabs.io" + convexConnectSrc + wsWorkerConnectSrc + bubblemapConnectSrc,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');

if (isDev) {
  csp = csp
    .replace(
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com https://platform.twitter.com https://releases.rivet.dev 'unsafe-eval'",
    )
    .replace(
      "connect-src 'self' https://auth.privy.io",
      "connect-src 'self' https://auth.privy.io ws://localhost:3000 http://localhost:3000 http://localhost:3210 ws://localhost:3210 http://localhost:8080 http://localhost:3088 https://api.rivet.dev wss://api.rivet.dev https://*.rivet.dev wss://*.rivet.dev https://api.gopluslabs.io",
    )
    .replace(
      "worker-src 'self'",
      "worker-src 'self' blob:",
    )
    .replace(
      "style-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
    )
    .replace(
      "font-src 'self'",
      "font-src 'self'",
    )
    .replace(
      "frame-ancestors 'self'",
      "frame-ancestors 'self' http://localhost:3000 https://localhost:3000 https://0.0.0.0:3000",
    )
    .replace(
      "frame-src https://auth.privy.io https://*.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com https://privy.smoothie.fun blob:",
      "frame-src https://auth.privy.io https://*.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com https://privy.smoothie.fun blob: data:",
    )
    .replace(
      "img-src 'self' data: blob:",
      "img-src 'self' data: blob: https: http://localhost:3210 https://localhost:3210 http://127.0.0.1:3210 https://127.0.0.1:3210",
    );
  // Ensure media (video/audio) from local Convex and trusted CDNs load in dev
  csp = csp.replace(
    "media-src 'self' data: blob:",
    "media-src 'self' data: blob: http://localhost:3210 https://localhost:3210 http://127.0.0.1:3210 https://127.0.0.1:3210 https://*.convex.cloud https://*.convex.site https://cloud.smoothie.fun https://video.twimg.com",
  );
}

const baseRemotePatterns: RemotePattern[] = [
  { protocol: 'https', hostname: 'coingecko.com' },
  { protocol: 'https', hostname: 'pravatar.cc' },
  { protocol: 'https', hostname: 'privy.io' },
  { protocol: 'https', hostname: '**.mypinata.cloud' },
  { protocol: 'https', hostname: 'ipfs.io' },
  { protocol: 'https', hostname: '**.ipfs.io' },
  { protocol: 'https', hostname: 'truth.myfilebase.com' },
  { protocol: 'https', hostname: '**.myfilebase.com' },
  { protocol: 'https', hostname: 'gmgn.ai' },
  { protocol: 'https', hostname: 'axiomtrading.sfo3.cdn.digitaloceanspaces.com' },
  // { protocol: 'https', hostname: '**sentry.io' },
  { protocol: 'https', hostname: '**.convex.cloud' },
  { protocol: 'https', hostname: '**.convex.site' },
  { protocol: 'https', hostname: 'fonts.reown.com' },
  { protocol: 'https', hostname: 'unavatar.io' },
  { protocol: 'https', hostname: 'video.twimg.com' },
  { protocol: 'https', hostname: 'pbs.twimg.com' },
  { protocol: 'https', hostname: 'cdn.dexscreener.com' },
  { protocol: 'https', hostname: 'dexscreener.com' },
  { protocol: 'https', hostname: 'metadata.mobula.io' },
  { protocol: 'https', hostname: '**' },
];

const devRemotePatterns: RemotePattern[] = [
  { protocol: 'http', hostname: 'localhost' },
  { protocol: 'https', hostname: 'localhost' },
  { protocol: 'https', hostname: '*' },
];

const remotePatterns: RemotePattern[] = isDev ? [...baseRemotePatterns, ...devRemotePatterns] : baseRemotePatterns;

const nextConfig: NextConfig = {
  allowedDevOrigins: ['posthypnotically-fluorescent-lashawna.ngrok-free.dev'],
  output: 'standalone',
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_DEPLOY_ID: deployId,
  },
  images: {
    remotePatterns,
  },

  turbopack: {
    root: __dirname,
    resolveAlias: {
      'pino': './src/utils/pino-stub.js',
      'thread-stream': './src/utils/pino-stub.js',
    },
  },

  // Ensure Next.js only processes files in current directory
  experimental: {
    externalDir: false,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toggle',
      '@radix-ui/react-tooltip',
      'motion',
      'date-fns',
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        worker_threads: false,
      };
    }
    return config;
  },

  async redirects() {
    return [
      {
        source: '/feed',
        destination: '/strategies',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/static/charting_library/charting_library/charting_library.js',
        headers: [
          { key: 'Cache-Control', value: isDev ? 'no-store' : 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  }
};

export default withBundleAnalyzer(nextConfig);

// export default withSentryConfig(nextConfig, {
//   // For all available options, see:
//   // https://www.npmjs.com/package/@sentry/webpack-plugin#options

//   org: "smoothiefun",
//   project: "javascript-nextjs",

//   // Only print logs for uploading source maps in CI
//   silent: !process.env.CI,

//   // For all available options, see:
//   // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

//   // Limit sourcemap upload surface to reduce build/upload time
//   widenClientFileUpload: false,

//   // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
//   // This can increase your server load as well as your hosting bill.
//   // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
//   // side errors will fail.
//   tunnelRoute: "/monitoring",

//   // Automatically tree-shake Sentry logger statements to reduce bundle size
//   disableLogger: true,

//   // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
//   // See the following for more information:
//   // https://docs.sentry.io/product/crons/
//   // https://vercel.com/docs/cron-jobs
//   automaticVercelMonitors: true,
// });
