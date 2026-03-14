import React, { useId } from "react";

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
  ({ label, description, error, name, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? name ?? generatedId;
    return (
      <UIField>
        {label && <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>}
        <FieldContent>
          <Input
            className="bg-white"
            ref={ref}
            id={fieldId}
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
