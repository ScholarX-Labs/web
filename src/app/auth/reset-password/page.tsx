import ResetPasswordForm from "@/app/auth/_components/ResetPasswordForm";
import Image from "next/image";
import { Suspense } from "react";
import RESET_PASSWORD_IMG from "../../../../public/reset-password.png";

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex flex-col bg-auth-surface lg:flex-row items-center justify-center w-full gap-8 lg:gap-16 p-6 pt-16">
      <div className="w-full lg:w-1/2 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-10 text-center">
          Change Your Password
        </h1>

        <Suspense
          fallback={
            <div className="h-64 flex items-center justify-center">
              Loading form...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>

      <div className="w-full lg:w-1/2 hidden lg:flex items-center justify-center min-h-100 max-w-md">
        <div className="relative w-full aspect-square">
          <Image
            src={RESET_PASSWORD_IMG}
            alt="Password Security Illustration"
            fill
            sizes="(min-width: 250px) 28rem, 90vw"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
