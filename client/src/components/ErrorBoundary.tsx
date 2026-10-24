import { Component, type ErrorInfo, type ReactNode } from "react";

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
        <main>
          <h1>Something went wrong</h1>
          <p>The page hit an unexpected error. Your account data has not been changed by this screen.</p>
          <button type="button" onClick={() => window.location.assign("/")}>Return home</button>
        </main>
      );
    }

    return this.props.children;
  }
}
