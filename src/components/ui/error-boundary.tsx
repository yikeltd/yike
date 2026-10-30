"use client";

import React, { Component, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { CONSUMER_ROUTES } from "@/lib/navigation/consumer-routes";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  /** When true, show Home (for isolated sections without app nav chrome). */
  showHomeEscape?: boolean;
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

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="pressable flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-light"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
            {this.props.showHomeEscape ? (
              <Link
                href={CONSUMER_ROUTES.home}
                className="pressable flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-4 py-2 text-xs font-bold text-navy hover:bg-navy/5"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </Link>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
