import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

import {
  emailOTPClient,
  inferAdditionalFields,
  phoneNumberClient,
} from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    phoneNumberClient(),
    emailOTPClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, emailOtp } = authClient;

export { authClient };
