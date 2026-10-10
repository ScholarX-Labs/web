// open-next.config.ts disabled to prevent OpenNext/Cloudflare tooling
// during Vercel builds (workerd binary invocation causes GLIBC issues).
// Re-enable by renaming this file back to `open-next.config.ts`.

const config: any = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto", "pg-cloudflare"],
  build: { compilerOptions: { externals: ["pg-cloudflare"] } },
  dangerous: {
    enableCacheInterception: false,
  },
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
