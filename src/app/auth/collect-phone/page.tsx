import { getSession } from "@/lib/dal";
import { redirect } from "next/navigation";
import PhoneForm from "@/app/auth/_components/PhoneForm";

export default async function Page() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  if (session.user.phoneNumber) {
    redirect("/");
  }

  return (
    <section className="bg-[oklch(96%_0.02_228.96)] h-full w-full flex justify-center items-center p-4">
      <div className="min-h-3/4 lg:w-3/8 w-1/2 p-6 rounded-2xl flex flex-col gap-4">
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
