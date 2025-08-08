import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-bold mb-2 text-red-600">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || "An unexpected error occurred while loading the chat."}
            </p>
            <div className="space-x-2">
              <Button 
                onClick={() => this.setState({ hasError: false, error: undefined })}
                variant="outline"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="default"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
