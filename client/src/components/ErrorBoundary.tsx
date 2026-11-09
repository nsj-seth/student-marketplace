import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background px-4 py-10 text-foreground">
          <section className="mx-auto grid w-full max-w-2xl place-items-center rounded-[1.75rem] border border-border bg-card px-6 py-12 text-center shadow-sm">
            <span className="grid size-16 place-items-center rounded-2xl bg-warning-soft text-warning-foreground">
              <AlertTriangle className="size-7" />
            </span>
            <span className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-warning-foreground">
              Something went wrong
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-[-.04em]">
              This page hit an unexpected error.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Your account data has not been changed by this screen. You can retry the page or return to the marketplace.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                data-ui="error-retry"
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <RefreshCcw className="size-4" />
                Retry page
              </button>
              <button
                data-ui="error-home"
                type="button"
                onClick={() => window.location.assign("/")}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
              >
                <Home className="size-4" />
                Return home
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
