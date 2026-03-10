import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

import {
  inferAdditionalFields,
  phoneNumberClient,
} from "better-auth/client/plugins";
export const { signIn, signUp, signOut, useSession } = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), phoneNumberClient()],
});
