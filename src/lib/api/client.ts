import axios from "axios";
import { env } from "@/config/env";

/**
 * Global Axios Client
 * Configured with base URL from environment.
 *
 * NOTE: Auth interceptors (Bearer token injection, 401 handling) will be
 * added by the auth team. This client is kept auth-agnostic intentionally.
 */
export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
