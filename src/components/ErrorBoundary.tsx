import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Something went wrong.</h1>
          <p className="text-lg mb-8">We're sorry for the inconvenience. Please try refreshing the page.</p>
          {this.state.error && (
            <details className="bg-gray-800 p-4 rounded-lg w-full max-w-2xl">
              <summary className="cursor-pointer text-yellow-500">Error Details</summary>
              <pre className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
