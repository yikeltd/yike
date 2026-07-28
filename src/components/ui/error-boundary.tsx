"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "test") {
      console.error("[YIKE_ERROR_BOUNDARY] Caught exception:", error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-3xl border border-navy/10 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-800">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-navy">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h3>
          <p className="mt-1 max-w-md text-xs text-navy/70 leading-relaxed">
            {this.props.fallbackDescription ??
              "An unexpected error occurred while rendering this section. Our system has logged the event."}
          </p>

          <button
            type="button"
            onClick={this.handleReset}
            className="pressable mt-4 flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-light"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
