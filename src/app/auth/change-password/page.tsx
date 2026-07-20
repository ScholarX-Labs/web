import { getSession } from "@/lib/dal";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/app/auth/_components/ChangePasswordForm";
import { ROUTES } from "@/lib/routes";

export default async function Page() {
  const session = await getSession();

  if (!session) {
    redirect(ROUTES.SIGNIN);
  }

  if (!(session.user as Record<string, unknown>).mustChangePassword) {
    redirect("/");
  }

  return (
    <section className="bg-auth-surface min-h-screen w-full flex justify-center items-center p-4">
      <div className="w-full max-w-md md:max-w-lg p-6 rounded-2xl flex flex-col gap-4 bg-white/80 backdrop-blur-sm shadow-sm">
        <h2 className="text-center text-3xl font-semibold">
          Change Your Password
        </h2>
        <p className="text-center text-sm text-muted-foreground">
          You must change your temporary password before continuing.
        </p>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
