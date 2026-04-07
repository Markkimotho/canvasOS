import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => undefined });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const colors: Record<Toast["type"], string> = {
    info: "#6366f1",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "1rem",
          right: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              background: colors[t.type],
              color: "#fff",
              fontSize: "14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              animation: "slideIn 0.2s ease",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
