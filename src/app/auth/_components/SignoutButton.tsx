"use client";

import type { ComponentProps, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type SignoutButtonProps = ComponentProps<"button">;

function SignoutButton({
  className,
  children,
  onClick,
  type = "button",
  ...props
}: SignoutButtonProps) {
  const router = useRouter();

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    await signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      className={cn("hover:cursor-pointer", className)}
      {...props}
    >
      {children ?? "Logout"}
    </button>
  );
}

export default SignoutButton;
