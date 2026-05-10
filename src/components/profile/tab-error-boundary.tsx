"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error(`[TabErrorBoundary${this.props.tabName ? `:${this.props.tabName}` : ""}] Error:`, error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {this.props.tabName
                ? `Failed to load ${this.props.tabName}.`
                : "Failed to load this section."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
