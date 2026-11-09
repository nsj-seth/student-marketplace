import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions
}: AdminPageHeaderProps) {
  return (
    <section className="flex flex-col gap-5 pb-3 pt-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <span className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-text">
          {icon}
          {eyebrow}
        </span>
        <h1 className="text-3xl font-semibold tracking-[-.025em] sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}

export function AdminEmptyState({
  icon,
  title,
  description,
  action
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-card text-primary-text shadow-sm">
        {icon}
      </span>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminMetricCard({
  label,
  value,
  hint,
  icon,
  tone = "primary"
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "blue";
}) {
  const toneClass =
    tone === "success"
      ? "bg-success-soft text-success-foreground"
      : tone === "warning"
        ? "bg-warning-soft text-warning-foreground"
        : tone === "danger"
          ? "bg-danger-soft text-danger-foreground"
          : tone === "blue"
            ? "bg-info-soft text-info-foreground"
            : "bg-primary/10 text-primary-text";

  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={"grid size-9 shrink-0 place-items-center rounded-lg " + toneClass}>{icon}</span>
      </div>
      <strong className="mt-5 block break-words text-2xl font-semibold tracking-tight">{value}</strong>
      <small className="mt-4 block text-sm leading-5 text-muted-foreground">{hint}</small>
    </article>
  );
}
