"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Mail, Lock, Eye, EyeClosed, User, ArrowRight, Check, X, Phone,
} from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { ROUTES } from "@/lib/routes";
import { springSnappy, tapScale } from "@/lib/motion-variants";

const signupSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }).max(50),
    lastName: z.string().min(1, { message: "Last name is required" }).max(50),
    email: z.string().email({ message: "Enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(128, { message: "Password is too long" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
    phoneNumber: z
      .string()
      .min(1, { message: "Phone number is required" })
      .refine((v) => isValidPhoneNumber(v), {
        message: "Invalid phone number",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type SignupForm = z.infer<typeof signupSchema>;

type PasswordStrength = {
  score: number;
  label: string;
  color: string;
};

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "", color: "bg-gray-600" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-orange-400" },
    { label: "Good", color: "bg-yellow-400" },
    { label: "Strong", color: "bg-green-400" },
    { label: "Very strong", color: "bg-emerald-400" },
  ];
  return { score, ...levels[score] };
}

const passwordRequirements = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
];

export default function Page() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const {
    register,
    handleSubmit,
    setError,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    },
  });

  const passwordValue = watch("password");
  const strength = getPasswordStrength(passwordValue ?? "");

  const isAnySubmitting = isSubmitting || isSocialSubmitting;

  const onSubmit = async (data: SignupForm) => {
    if (isSocialSubmitting) return;
    setServerError(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword: _confirmPassword, ...payload } = data;

    const { error } = await signUp.email({
      email: payload.email,
      password: payload.password,
      name: `${payload.firstName} ${payload.lastName}`,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      callbackURL: "/",
    });

    if (error) {
      const message = error.message ?? "";
      const hasEmailExistsError = message.includes("ERR_EMAIL_EXISTS");
      const hasPhoneExistsError = message.includes("ERR_PHONE_EXISTS");

      if (hasEmailExistsError) {
        setError("email", {
          type: "server",
          message: "Email already exists",
        });
      }

      if (hasPhoneExistsError) {
        setError("phoneNumber", {
          type: "server",
          message: "Phone number already exists",
        });
      }

      if (hasEmailExistsError || hasPhoneExistsError) {
        return;
      }

      if (error.status === 422 || message.toLowerCase().includes("invalid")) {
        setServerError("Invalid details provided. Please check your inputs.");
        return;
      }

      setServerError(
        error.message || "Something went wrong. Please try again.",
      );
      return;
    }

    // Force a full navigation so server-rendered auth state is rebuilt
    // with the newly issued session cookie instead of stale prefetched data.
    window.location.assign("/");
  };

  const onGoogleSignIn = async () => {
    if (isAnySubmitting) return;

    setServerError(null);
    setIsSocialSubmitting(true);

    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: ROUTES.PHONE_COLLECTION,
      });

      if (result?.error) {
        setServerError(
          result.error.message ??
            "Unable to continue with Google. Please try again.",
        );
      }
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full h-10 rounded-lg bg-white/5 border ${hasError ? "border-red-500/50" : "border-transparent focus:border-white/20"} text-white placeholder:text-white/30 px-3 text-sm transition-all duration-300 focus:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-white/20 outline-none`;

  return (
    <div className="min-h-screen w-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/30 via-purple-700/40 to-black" />

      <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[50vh] rounded-b-[50%] bg-purple-400/15 blur-[80px]" />
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100vh] h-[50vh] rounded-b-full bg-purple-300/15 blur-[60px]"
        animate={{
          opacity: [0.1, 0.25, 0.1],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "mirror"
        }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[80vh] h-[80vh] rounded-t-full bg-purple-400/15 blur-[60px]"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "mirror",
          delay: 1
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 10 }}
        >
          <div className="relative group">
            <motion.div
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(255,255,255,0.03)",
                  "0 0 15px 5px rgba(255,255,255,0.05)",
                  "0 0 10px 2px rgba(255,255,255,0.03)"
                ],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "mirror"
              }}
            />

            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-70"
                animate={{
                  left: ["-50%", "100%"],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" }
                }}
              />
              <motion.div
                className="absolute top-0 right-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-white/60 to-transparent opacity-70"
                animate={{
                  top: ["-50%", "100%"],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  top: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 0.6 }
                }}
              />
              <motion.div
                className="absolute bottom-0 right-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-70"
                animate={{
                  right: ["-50%", "100%"],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  right: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.2 }
                }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-white/60 to-transparent opacity-70"
                animate={{
                  bottom: ["-50%", "100%"],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  bottom: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.8 }
                }}
              />
            </div>

            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                  backgroundSize: '30px 30px'
                }}
              />

              <div className="text-center space-y-1 mb-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="mx-auto w-10 h-10 rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden"
                >
                  <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">S</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                >
                  Create your account
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-white/60 text-xs"
                >
                  Join ScholarX and start learning
                </motion.p>
              </div>

              <AnimatePresence mode="wait">
                {serverError && (
                  <motion.p
                    key="server-error"
                    initial={{ opacity: 0, y: -5, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -5, height: 0 }}
                    className="text-red-400 text-xs text-center mb-4"
                  >
                    {serverError}
                  </motion.p>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.div
                    className="flex-1 space-y-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <User className={`absolute left-3 w-4 h-4 transition-all duration-300 z-10 ${focusedInput === "firstName" ? "text-white" : "text-white/40"}`} />
                      <input
                        placeholder="First name"
                        {...register("firstName")}
                        onFocus={() => setFocusedInput("firstName")}
                        onBlur={() => setFocusedInput(null)}
                        data-slot="input"
                        className={inputClass(!!errors.firstName)}
                        autoComplete="given-name"
                      />
                    </div>
                    <AnimatePresence mode="wait">
                      {errors.firstName && (
                        <motion.p
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          className="text-red-400 text-xs pl-1"
                        >
                          {errors.firstName.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div
                    className="flex-1 space-y-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <User className={`absolute left-3 w-4 h-4 transition-all duration-300 z-10 ${focusedInput === "lastName" ? "text-white" : "text-white/40"}`} />
                      <input
                        placeholder="Last name"
                        {...register("lastName")}
                        onFocus={() => setFocusedInput("lastName")}
                        onBlur={() => setFocusedInput(null)}
                        data-slot="input"
                        className={inputClass(!!errors.lastName)}
                        autoComplete="family-name"
                      />
                    </div>
                    <AnimatePresence mode="wait">
                      {errors.lastName && (
                        <motion.p
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          className="text-red-400 text-xs pl-1"
                        >
                          {errors.lastName.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                <motion.div
                  className="space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 z-10 ${focusedInput === "email" ? "text-white" : "text-white/40"}`} />
                    <input
                      type="email"
                      placeholder="Email address"
                      {...register("email")}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      data-slot="input"
                      className={inputClass(!!errors.email)}
                      autoComplete="email"
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-red-400 text-xs pl-1"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 z-10 ${focusedInput === "password" ? "text-white" : "text-white/40"}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      {...register("password")}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      data-slot="input"
                      className={inputClass(!!errors.password) + " pl-10 pr-10"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 z-10 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                      ) : (
                        <EyeClosed className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                      )}
                    </button>
                  </div>

                  {passwordValue && passwordValue.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2 pt-1"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-white/10"}`}
                          />
                        ))}
                      </div>
                      {strength.label && (
                        <p className="text-xs text-white/50">{strength.label}</p>
                      )}
                      <div className="space-y-1">
                        {passwordRequirements.map((req) => {
                          const passed = req.test(passwordValue);
                          return (
                            <motion.div
                              key={req.label}
                              className="flex items-center gap-1.5"
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                            >
                              {passed ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <X className="w-3 h-3 text-white/30" />
                              )}
                              <span className={`text-xs ${passed ? "text-green-400/80" : "text-white/40"}`}>
                                {req.label}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  <AnimatePresence mode="wait">
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-red-400 text-xs pl-1"
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 z-10 ${focusedInput === "confirmPassword" ? "text-white" : "text-white/40"}`} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      {...register("confirmPassword")}
                      onFocus={() => setFocusedInput("confirmPassword")}
                      onBlur={() => setFocusedInput(null)}
                      data-slot="input"
                      className={inputClass(!!errors.confirmPassword) + " pl-10 pr-10"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 z-10 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                      ) : (
                        <EyeClosed className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                      )}
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    {errors.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-red-400 text-xs pl-1"
                      >
                        {errors.confirmPassword.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <div className="relative flex items-center overflow-hidden rounded-lg">
                    <Phone className={`absolute left-3 w-4 h-4 transition-all duration-300 z-10 ${focusedInput === "phone" ? "text-white" : "text-white/40"}`} />
                    <Controller
                      name="phoneNumber"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          international
                          defaultCountry="EG"
                          placeholder="+20 123 456 7890"
                          value={field.value}
                          onChange={(val) => field.onChange(val ?? "")}
                          data-slot="input"
                          className={`w-full [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:h-10 [&_.PhoneInputInput]:rounded-lg [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:text-white [&_.PhoneInputInput]:placeholder:text-white/30 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:pl-2 [&_.PhoneInputInput]:outline-none [&_.PhoneInputCountry]:ml-0 [&_.PhoneInputCountry]:bg-transparent [&_.PhoneInputCountrySelectArrow]:text-white/40 ${inputClass(!!errors.phoneNumber)}`}
                        />
                      )}
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    {errors.phoneNumber && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-red-400 text-xs pl-1"
                      >
                        {errors.phoneNumber.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    whileHover={tapScale.whileHover}
                    whileTap={tapScale.whileTap}
                    transition={springSnappy}
                    type="submit"
                    disabled={isAnySubmitting}
                    className="w-full relative group/button mt-2"
                  >
                    <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />

                    <div className="relative overflow-hidden bg-white text-black font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {isAnySubmitting ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center"
                          >
                            <div className="w-4 h-4 border-2 border-black/70 border-t-transparent rounded-full animate-spin" />
                          </motion.div>
                        ) : (
                          <motion.span
                            key="button-text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-1 text-sm font-medium"
                          >
                            Create Account
                            <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                </motion.div>

                <div className="relative flex items-center my-4">
                  <div className="flex-grow border-t border-white/5" />
                  <motion.span
                    className="mx-3 text-xs text-white/40"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: [0.7, 0.9, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    or
                  </motion.span>
                  <div className="flex-grow border-t border-white/5" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <motion.button
                    whileHover={tapScale.whileHover}
                    whileTap={tapScale.whileTap}
                    transition={springSnappy}
                    type="button"
                    disabled={isAnySubmitting}
                    onClick={onGoogleSignIn}
                    className="w-full relative group/google"
                  >
                    <div className="absolute inset-0 bg-white/5 rounded-lg blur opacity-0 group-hover/google:opacity-70 transition-opacity duration-300" />
                    <div className="relative overflow-hidden bg-white/5 text-white font-medium h-10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2">
                      <GoogleIcon />
                      <span className="text-white/80 group-hover/google:text-white transition-colors text-xs">
                        {isAnySubmitting ? "Loading..." : "Continue with Google"}
                      </span>
                    </div>
                  </motion.button>
                </motion.div>

                <motion.p
                  className="text-center text-xs text-white/60 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Already have an account?{' '}
                  <Link
                    href={ROUTES.SIGNIN}
                    className="relative inline-block group/signin"
                  >
                    <span className="relative z-10 text-white group-hover/signin:text-white/70 transition-colors duration-300 font-medium">
                      Sign in
                    </span>
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white group-hover/signin:w-full transition-all duration-300" />
                  </Link>
                </motion.p>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
