import { z } from "zod";

// Schema without custom messages — used by the API route for server-side validation.
// The form layer uses createContactSchema() with translated messages instead.
export const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().pipe(z.email()),
  phoneNumber: z
    .string()
    .trim()
    .max(25)
    .optional()
    .transform((v) => v || undefined),
  message: z.string().trim().min(10).max(2000),
});

export type ContactSchemaMessages = {
  firstNameRequired: string;
  firstNameMax: string;
  lastNameRequired: string;
  lastNameMax: string;
  emailInvalid: string;
  phoneNumberMax: string;
  messageMin: string;
  messageMax: string;
};

export function createContactSchema(messages: ContactSchemaMessages) {
  return z.object({
    firstName: z
      .string()
      .trim()
      .min(1, { message: messages.firstNameRequired })
      .max(50, { message: messages.firstNameMax }),
    lastName: z
      .string()
      .trim()
      .min(1, { message: messages.lastNameRequired })
      .max(50, { message: messages.lastNameMax }),
    email: z
      .string()
      .trim()
      .pipe(z.email({ message: messages.emailInvalid })),
    phoneNumber: z
      .string()
      .trim()
      .max(25, { message: messages.phoneNumberMax })
      .optional()
      .transform((value) => {
        return value ? value : undefined;
      }),
    message: z
      .string()
      .trim()
      .min(10, { message: messages.messageMin })
      .max(2000, { message: messages.messageMax }),
  });
}

export type ContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  message: string;
};

export type ContactFormInput = ContactFormValues;
