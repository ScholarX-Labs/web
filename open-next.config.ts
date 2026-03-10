import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      incrementalCache: async () => {
        const { KVCache } = await import("@opennextjs/cloudflare/kvCache");
        return new KVCache();
      },
    },
  },
};

export default config;
