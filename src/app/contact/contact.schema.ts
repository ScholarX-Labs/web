import { z } from "zod";

export const contactSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name must be 50 characters or less" }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(50, { message: "Last name must be 50 characters or less" }),
  email: z.email({ message: "Enter a valid email address" }),
  phoneNumber: z
    .string()
    .max(25, { message: "Phone number must be 25 characters or less" })
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    }),
  message: z
    .string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(2000, { message: "Message must be 2000 characters or less" }),
});

export type ContactFormInput = z.input<typeof contactSchema>;
export type ContactFormValues = z.output<typeof contactSchema>;
