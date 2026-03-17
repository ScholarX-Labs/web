const isDevelopment = process.env.NODE_ENV === "development";
const bypassFlagEnabled = process.env.DEV_AUTH_BYPASS === "true";

export const isDevAuthBypassEnabled = isDevelopment && bypassFlagEnabled;

export type DevBypassRole = "user" | "admin";

const rawRole = process.env.DEV_AUTH_BYPASS_ROLE;
export const devAuthBypassRole: DevBypassRole =
  rawRole === "admin" ? "admin" : "user";

if (!isDevelopment && bypassFlagEnabled) {
  console.warn(
    "[auth] DEV_AUTH_BYPASS is ignored because NODE_ENV is not development.",
  );
}
