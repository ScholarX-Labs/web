import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

import {
  inferAdditionalFields,
  phoneNumberClient,
} from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), phoneNumberClient()],
});

export const { signIn, signUp, signOut, useSession, sendVerificationEmail } =
  authClient;

export { authClient };
