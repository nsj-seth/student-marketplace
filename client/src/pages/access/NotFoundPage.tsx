import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <section className="mx-auto mt-10 grid w-[min(680px,calc(100%-32px))] place-items-center rounded-[1.75rem] border border-border bg-card px-6 py-12 text-center shadow-sm">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary-text">
          <Compass className="size-7" />
        </span>
        <span className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-primary-text">404</span>
        <h1 className="mt-3 text-3xl font-bold tracking-[-.04em]">Page not found</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          The page you tried to open does not exist or may have moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            to="/"
          >
            <ArrowLeft className="size-4" />
            Marketplace home
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
            to="/products"
          >
            Browse products
          </Link>
        </div>
      </section>
    </main>
  );
}
