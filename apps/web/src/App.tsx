import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ToastProvider";
import { WorkspacePage } from "./pages/WorkspacePage";
import { WelcomePage } from "./pages/WelcomePage";

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/workspace/:projectId?" element={<WorkspacePage />} />
          </Routes>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
