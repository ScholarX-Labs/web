import type React from "react";
import { cn } from "@/lib/utils";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span
      className={cn(
        "relative inline-flex w-full rounded-lg border border-input bg-background text-sm text-foreground shadow-sm transition-shadow has-focus-visible:ring-[3px] has-focus-visible:ring-ring/24 has-[:disabled]:opacity-50",
        className,
      )}
      data-slot="input-control"
    >
      <input
        className="h-8 w-full min-w-0 rounded-[inherit] bg-transparent px-3 leading-8 outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
        {...props}
      />
    </span>
  );
}

export default function FieldDemo() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input placeholder="Enter your name" type="text" />
          <FieldDescription>Visible on your profile</FieldDescription>
        </Field>

        <Field>
          <FieldLabel>
            Password <span className="text-destructive-foreground">*</span>
          </FieldLabel>
          <Input placeholder="Enter password" required type="password" />
          <FieldError>Please fill out this field.</FieldError>
        </Field>

        <Field disabled>
          <FieldLabel>Email</FieldLabel>
          <Input disabled placeholder="Enter your email" type="email" />
          <FieldDescription>This field is currently disabled.</FieldDescription>
        </Field>
      </div>
    </div>
  );
}
