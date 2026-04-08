"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Course } from "@/types/course.types";
import { useEnrollmentStore } from "@/stores/enrollment.store";
import { coursesService } from "@/lib/api/courses.service";
import { toast } from "sonner";
import {
  Loader2,
  ShieldCheck,
  PlayCircle,
  Award,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { EnrollmentSuccess } from "./enrollment-success";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";

interface EnrollModalProps {
  course: Course;
  autoOpen?: boolean;
}

export function EnrollModal({ course, autoOpen = false }: EnrollModalProps) {
  const {
    isModalOpen,
    isEnrolling,
    isSuccess,
    openModal,
    closeModal,
    setEnrolling,
    setSuccess,
  } = useEnrollmentStore();
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Implement auto-open logic with a slight delay so page transitions nicely first
    if (autoOpen && !hasAutoOpened) {
      const timer = setTimeout(() => {
        openModal();
        setHasAutoOpened(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, hasAutoOpened, openModal]);

  const isPaid = (course.price ?? 0) > 0;

  const requireAuth = (): boolean => {
    if (!session?.user) {
      closeModal();
      const redirectUrl = `${ROUTES.SIGNIN}?callbackUrl=${encodeURIComponent(pathname || "/")}`;
      router.push(redirectUrl);
      return false;
    }
    return true;
  };

  const handleEnrollFree = async () => {
    if (!requireAuth()) return;
    setEnrolling(true);
    try {
      // Assuming user has valid session at this point
      await coursesService.enrollFree(course.id);
      setSuccess(true);
      toast.success("Enrollment successful!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleGoToApplication = () => {
    if (!requireAuth()) return;
    // If requiresForm is true, we would route to an application wizard page here.
    toast.info("Navigating to application wizard...");
  };

  const handleGoToCheckout = () => {
    if (!requireAuth()) return;
    toast.info("Stripe Payment coming soon");
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-card border-slate-200 dark:border-slate-800 rounded-3xl gap-0">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="enroll-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-100 dark:border-slate-800">
                <DialogHeader>
                  <DialogTitle className="sr-only">
                    Enroll in {course.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex gap-4">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-md">
                    <Image
                      src={
                        course.thumbnail ||
                        "https://images.unsplash.com/photo-1620064916958-605375619af8"
                      }
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 truncate">
                      By {course.instructor?.name || "Expert Instructor"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    What you get
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <PlayCircle className="w-5 h-5 text-hero-blue" />
                      {course.duration || "12 hours"} of high-quality video
                      content
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <Award className="w-5 h-5 text-hero-blue" />
                      Certificate of completion included
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <ShieldCheck className="w-5 h-5 text-hero-blue" />
                      Lifetime access to all updates
                    </li>
                  </ul>
                </div>

                <div className="pt-2">
                  {!isPaid ? (
                    <button
                      onClick={handleEnrollFree}
                      disabled={isEnrolling}
                      className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-hero-blue to-hero-blue-dark text-white font-bold rounded-xl py-4 shadow-lg shadow-hero-blue/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isEnrolling ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        "Enroll for Free"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={
                        course.requiresForm
                          ? handleGoToApplication
                          : handleGoToCheckout
                      }
                      className="w-full flex items-center justify-between px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl py-4 transition-all active:scale-[0.98] group"
                    >
                      <span className="flex items-center gap-2">
                        {course.requiresForm ? "Apply Now" : "Checkout Now"}
                      </span>
                      <span className="flex items-center gap-2">
                        ${course.currentPrice}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </button>
                  )}

                  <p className="text-center text-xs text-slate-500 mt-4 px-4 flex justify-center items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Secure enrollment. Cancel anytime within 30 days.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="p-8"
            >
              <EnrollmentSuccess
                course={course}
                onClose={() => {
                  closeModal();
                  // Reset state after closing animation
                  setTimeout(() => setSuccess(false), 300);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
