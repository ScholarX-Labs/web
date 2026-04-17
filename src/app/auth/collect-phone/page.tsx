import { getSession } from "@/lib/dal";
import { redirect } from "next/navigation";
import PhoneForm from "@/app/auth/_components/PhoneForm";
import { ROUTES } from "@/lib/routes";

export default async function Page() {
  const session = await getSession();

  if (!session) {
    redirect(ROUTES.SIGNIN);
  }

  if (session.user.phoneNumber) {
    redirect("/");
  }

  return (
    <section className="bg-auth-surface min-h-screen w-full flex justify-center items-center p-4">
      <div className="w-full max-w-md md:max-w-lg p-6 rounded-2xl flex flex-col gap-4 bg-white/80 backdrop-blur-sm shadow-sm">
        <h2 className="text-center text-3xl font-semibold">
          Add your phone number
        </h2>
        <p className="text-center text-sm text-muted-foreground">
          Please provide your phone number to continue using the site.
        </p>
        <PhoneForm />
      </div>
    </section>
  );
}
