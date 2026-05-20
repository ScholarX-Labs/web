import { getSession } from "@/lib/dal";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default async function SigninLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session) {
    redirect(ROUTES.HOME);
  }

  return <>{children}</>;
}
