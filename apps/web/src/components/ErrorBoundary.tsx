import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CanvasOS Error:", error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "1rem",
              color: "#f0f0f0",
              background: "#1a1a1a",
            }}
          >
            <h2>Something went wrong</h2>
            <pre
              style={{
                color: "#ef4444",
                fontSize: "12px",
                maxWidth: "600px",
                whiteSpace: "pre-wrap",
              }}
            >
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
