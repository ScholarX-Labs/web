import { redirect } from "next/navigation";
import ResendVerificationEmailButton from "@/app/auth/_components/ResendVerificationEmailButton";
import SignoutButton from "@/app/auth/_components/SignoutButton";
import { getSession } from "@/lib/dal";
import { ROUTES } from "@/lib/routes";

export default async function VerifyEmailPage() {
  const session = await getSession();

  if (!session) {
    redirect(ROUTES.SIGNIN);
  }

  if (session.user.emailVerified) {
    if (!session.user.phoneNumber) {
      redirect(ROUTES.PHONE_COLLECTION);
    }

    redirect(ROUTES.HOME);
  }

  return (
    <section className="bg-auth-surface min-h-screen w-full flex justify-center items-center p-4">
      <div className="w-full max-w-md md:max-w-lg p-6 rounded-2xl flex flex-col gap-4 bg-white/80 backdrop-blur-sm shadow-sm">
        <h2 className="text-center text-3xl font-semibold">
          Verify your email
        </h2>
        <p className="text-center text-sm text-muted-foreground">
          Your account is signed in, but email verification is required before
          you can access protected features.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Send a verification link to <strong>{session.user.email}</strong> to
          continue.
        </p>
        <ResendVerificationEmailButton email={session.user.email} />
        <SignoutButton className="w-fit self-center p-1" />
      </div>
    </section>
  );
}
