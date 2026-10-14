import { Label } from "@/components/admin/ui/label";
import { cn } from "@/lib/cn";

/** Label + control + help/error, with ids wired for a11y. */
export function Field({
  id,
  label,
  help,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label id={`${id}-label`} htmlFor={id}>
        {label}
        {!required && <span className="font-normal text-muted-foreground">(opcional)</span>}
      </Label>
      {children}
      {help && !error && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Bordered group for a form section. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-lg border bg-card p-4 sm:p-6">
      <div className="space-y-1">
        <h2 className="font-medium">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
