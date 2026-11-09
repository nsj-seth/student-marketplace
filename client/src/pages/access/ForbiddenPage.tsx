import { ArrowLeft, ShieldX } from "lucide-react";
import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <section className="mx-auto mt-10 grid w-[min(680px,calc(100%-32px))] place-items-center rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm">
        <span className="grid size-16 place-items-center rounded-2xl bg-danger-soft text-danger-foreground">
          <ShieldX className="size-7" />
        </span>
        <span className="mt-5 text-xs font-bold uppercase tracking-[.1em] text-danger-foreground">
          Permission required
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-[-.025em]">Access denied</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Your account does not have permission to open this page.
        </p>
        <Link
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          to="/"
        >
          <ArrowLeft className="size-4" />
          Back to marketplace
        </Link>
      </section>
    </main>
  );
}
