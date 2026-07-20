import { redirect } from "next/navigation";
import SignoutButton from "@/app/auth/_components/SignoutButton";
import VerifyEmailOtpForm from "@/app/auth/_components/VerifyEmailOtpForm";
import SkipEmailVerificationButton from "@/app/auth/_components/SkipEmailVerificationButton";
import { getSession } from "@/lib/dal";
import { ROUTES } from "@/lib/routes";
import Image from "next/image";

const OTP_IMAGE = "/otp.jpg";
export default async function VerifyEmailPage() {
  const session = await getSession();

  if (!session) {
    redirect(ROUTES.SIGNIN);
  }

  if (session.user.emailVerified) {
    if ((session.user as Record<string, unknown>).mustChangePassword) {
      redirect(ROUTES.CHANGE_PASSWORD);
    }

    if (!session.user.phoneNumber) {
      redirect(ROUTES.PHONE_COLLECTION);
    }

    redirect(ROUTES.HOME);
  }

  const user = session.user as Record<string, unknown>;
  const previouslySkipped = Boolean(user.emailVerificationSkipped);

  return (
    <section className="bg-auth-surface min-h-screen w-full flex justify-center items-center p-4">
      <div className="w-full flex flex-row py-0 justify-around items-center ">
        <div className="w-full max-w-md md:max-w-lg p-6 rounded-2xl flex flex-col gap-4 bg-white/80 backdrop-blur-sm shadow-sm">
          <h2 className="text-center text-3xl font-semibold">
            Verify your email
          </h2>
          {previouslySkipped ? (
            <p className="text-center text-sm text-muted-foreground">
              You previously skipped email verification. Please verify your email
              to access all features.
            </p>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Your account is signed in, but email verification is required before
                you can access protected features.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Enter the 6-digit verification code sent to
                <strong> {session.user.email}</strong>.
              </p>
            </>
          )}
          <VerifyEmailOtpForm email={session.user.email} />
          <SkipEmailVerificationButton />
          <SignoutButton className="w-fit self-center p-1" />
        </div>
        <div className="w-full max-w-sm aspect-square relative lg:max-w-md xl:max-w-lg lg:inline hidden">
          <Image
            alt="OTP image"
            src={OTP_IMAGE}
            fill
            className="object-contain rounded-4xl"
            priority
          />
        </div>
      </div>
    </section>
  );
}
