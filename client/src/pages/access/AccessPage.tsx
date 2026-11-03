import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { checkRoleAccess, type AppRole } from "../../services/role.service";

export function AccessPage({ role }: { role: AppRole }) {
  const [message, setMessage] = useState("Checking server-side permission...");

  useEffect(() => {
    void checkRoleAccess(role)
      .then((response) => setMessage(response.data?.message ?? "Access granted."))
      .catch((error: Error) => setMessage(error.message));
  }, [role]);

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <section className="mx-auto mt-10 grid w-[min(680px,calc(100%-32px))] place-items-center rounded-[1.75rem] border border-border bg-card px-6 py-12 text-center shadow-sm">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-7" />
        </span>
        <Badge variant="secondary" className="mt-5">
          {role} access check
        </Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-[-.04em]">{role} area</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            to="/"
          >
            <ArrowLeft className="size-4" />
            Back home
          </Link>
          <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground">
            <BadgeCheck className="size-4 text-emerald-600" />
            Server-side RBAC verification
          </span>
        </div>
      </section>
    </main>
  );
}
