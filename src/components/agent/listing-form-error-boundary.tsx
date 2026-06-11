"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class ListingFormErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[listing-form] render error", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-6 text-center">
          <p className="font-semibold text-navy">Could not load listing form</p>
          <p className="mt-2 text-sm text-muted">
            Something went wrong. Your progress may still be saved as a draft.
          </p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
