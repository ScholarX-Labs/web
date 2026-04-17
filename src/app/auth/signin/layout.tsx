import { getSession } from "@/lib/dal";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import SigninPage from "./page";

export default async function Page() {
  const session = await getSession();

  if (session) {
    redirect(ROUTES.HOME);
  }

  return <SigninPage />;
}
