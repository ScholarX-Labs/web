"use client";

import type { ComponentProps, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignoutButtonProps = Omit<ComponentProps<typeof Button>, "asChild">;

function SignoutButton({
  className,
  children,
  onClick,
  type = "button",
  variant = "outline",
  size = "sm",
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
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(className)}
      {...props}
    >
      {children ?? (
        <>
          <LogOut className="h-4 w-4" />
          Logout
        </>
      )}
    </Button>
  );
}

export default SignoutButton;
