export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}
