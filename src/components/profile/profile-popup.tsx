"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";

import {
  User,
  LogOut,
  BookOpen,
  Award,
  Heart,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

import { useTranslations } from "next-intl";

interface ProfilePopupProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    firstName: string;
    lastName: string;
  };
}

const POPUP_HOVER_DELAY = 300;

export function ProfilePopup({ user }: ProfilePopupProps) {
  const router = useRouter();
  const t = useTranslations("profile.popup");

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
    router.refresh();
  };
  const [isOpen, setIsOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const handleOpen = useCallback(() => {
    clearTimers();
    openTimer.current = setTimeout(() => setIsOpen(true), POPUP_HOVER_DELAY);
  }, [clearTimers]);

  const handleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setIsOpen(false), 150);
  }, [clearTimers]);

  const handleClick = useCallback(() => {
    clearTimers();
    setIsOpen((prev) => !prev);
  }, [clearTimers]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const initials = `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          ref={triggerRef}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          onClick={handleClick}
          className="relative flex items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t("ariaLabel")}
        >
          <Avatar className="h-8 w-8 border-2 border-border">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
              {initials || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={popupRef}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        align="end"
        sideOffset={8}
        className="w-64"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-2 py-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-muted text-sm font-medium">
                {initials || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={ROUTES.PROFILE}
            className="flex cursor-pointer items-center gap-3"
          >
            <User className="h-4 w-4" />
            <span>{t("myProfile")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={ROUTES.MY_COURSES}
            className="flex cursor-pointer items-center gap-3"
          >
            <BookOpen className="h-4 w-4" />
            <span>{t("myCourses")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={ROUTES.CERTIFICATES}
            className="flex cursor-pointer items-center gap-3"
          >
            <Award className="h-4 w-4" />
            <span>{t("certificates")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={ROUTES.OPPORTUNITIES}
            className="flex cursor-pointer items-center gap-3"
          >
            <Heart className="h-4 w-4" />
            <span>{t("savedOpportunities")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-3 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>{t("signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
