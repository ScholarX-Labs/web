import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

import { inferAdditionalFields } from "better-auth/client/plugins";
export const { signIn, signUp, useSession } = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
});
