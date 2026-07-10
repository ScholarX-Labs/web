import { PostHog } from 'posthog-node';

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? "";
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? process.env.POSTHOG_HOST ?? "https://app.posthog.com";

let posthogClient: PostHog | null = null;

export default function getPostHogClient() {
  if (!posthogClient && key) {
    posthogClient = new PostHog(key, { host });
  }
  return posthogClient;
}
