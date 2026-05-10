import { getSession } from "@/lib/dal";
import PremiumHeaderClient from "./PremiumHeaderClient";

export default async function PremiumHeader() {
  const session = await getSession();
  const isLoggedIn = !!session?.session?.id;
  return <PremiumHeaderClient isLoggedIn={isLoggedIn} />;
}
