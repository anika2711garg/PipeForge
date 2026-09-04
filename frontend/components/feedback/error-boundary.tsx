"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorState } from "./error-state";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("PipeForge UI error", error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorState
          title="Something went wrong"
          message="The control center hit an unexpected rendering error. Try reloading this view."
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
