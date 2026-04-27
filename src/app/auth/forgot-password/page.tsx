import ForgotPasswordForm from "@/app/auth/_components/ForgotPasswordForm";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export default function ForgotPasswordPage() {
  return (
    <section className="bg-auth-surface h-full w-full flex justify-center items-center p-4 relative">
      <Link
        href={ROUTES.SIGNIN}
        className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MoveLeft size={16} />
        Back to sign in
      </Link>

      <div className="w-full max-w-md p-8 rounded-2xl bg-white shadow-xl flex flex-col items-center justify-center">
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
