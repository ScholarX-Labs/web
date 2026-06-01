"use client";

import { useSession } from "@/lib/auth-client";
import PremiumHeaderClient from "./PremiumHeaderClient";

export default function PremiumHeader() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.session?.id;
  return <PremiumHeaderClient isLoggedIn={isLoggedIn} />;
}
