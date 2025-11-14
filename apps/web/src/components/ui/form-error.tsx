import { FieldError } from "react-hook-form";

interface FormErrorProps {
  error?: FieldError;
  className?: string;
}

/**
 * Displays form field error messages in a consistent format
 */
export function FormError({ error, className }: FormErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <p className={`text-sm text-destructive ${className || ""}`}>
      {error.message}
    </p>
  );
}

