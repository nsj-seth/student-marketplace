import type { ReactNode } from "react";
import {
  BadgeCheck,
  HeartHandshake,
  ShieldCheck,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  points?: Array<{ title: string; description: string }>;
};

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  points = [
    {
      title: "Discover local sellers",
      description: "Shop from student and community businesses in one marketplace."
    },
    {
      title: "Track every order",
      description: "Follow each seller independently from checkout to fulfilment."
    },
    {
      title: "Grow with one account",
      description: "Start as a customer and apply to sell whenever you're ready."
    }
  ]
}: AuthLayoutProps) {
  const icons = [ShoppingBag, BadgeCheck, HeartHandshake];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-72px)] w-[min(1180px,calc(100%-32px))] items-stretch gap-6 py-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#17111f] p-7 text-white shadow-2xl shadow-violet-950/10 sm:p-10 lg:p-12">
          <div className="absolute -left-16 top-16 size-56 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute -right-16 bottom-6 size-64 rounded-full bg-fuchsia-500/15 blur-3xl" />

          <div className="relative flex h-full flex-col">
            <Link className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-white" to="/">
              <span className="grid size-9 place-items-center rounded-xl bg-white/10">
                <ShoppingBag className="size-4" />
              </span>
              Student Marketplace
            </Link>

            <div className="my-auto py-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-100 backdrop-blur">
                <Sparkles className="size-3.5" />
                {eyebrow}
              </span>

              <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-[1.03] tracking-[-.045em] sm:text-5xl">
                {title}
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-violet-100/75 sm:text-base">
                {description}
              </p>

              <div className="mt-8 grid gap-3">
                {points.map((point, index) => {
                  const Icon = icons[index] ?? ShieldCheck;
                  return (
                    <div
                      key={point.title}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-violet-200">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <strong className="block text-sm">{point.title}</strong>
                        <span className="mt-1 block text-xs leading-5 text-violet-100/65">
                          {point.description}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="m-0 text-xs text-violet-100/45">
              Student Marketplace · Local discovery, made simple.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center py-4 lg:py-8">
          <div className="w-full max-w-[520px]">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
