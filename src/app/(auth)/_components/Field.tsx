import React from "react";

import {
  Field as UIField,
  FieldLabel,
  FieldContent,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type FieldProps = React.ComponentProps<typeof Input> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string | undefined;
};

const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, description, error, name, ...props }, ref) => {
    return (
      <UIField>
        {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
        <FieldContent>
          <Input
            ref={ref}
            id={name}
            name={name}
            aria-invalid={error ? true : undefined}
            {...props}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {error && <FieldError>{error}</FieldError>}
        </FieldContent>
      </UIField>
    );
  },
);

Field.displayName = "Field";

export default Field;
