"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

function SignoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      Logout
    </button>
  );
}

export default SignoutButton;
