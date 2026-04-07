import { useEffect, Suspense, lazy } from "react";
import { useParams } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { TopNavBar } from "../components/TopNavBar";
import { SideNavBar } from "../components/SideNavBar";
import { BottomNavBar } from "../components/BottomNavBar";
import { useCanvasStore } from "../stores/canvasStore";

import { PaintingView } from "../views/PaintingView";
import { SculptingView } from "../views/SculptingView";
import { AIGenerationView } from "../views/AIGenerationView";
import { AnimationView } from "../views/AnimationView";
import { MusicView } from "../views/MusicView";
import { MasterWorkspaceView } from "../views/MasterWorkspaceView";
import { CollabView } from "../views/CollabView";
import { CodeArtView } from "../views/CodeArtView";

const DebugPanel = lazy(() =>
  import("../components/DebugPanel").then((m) => ({ default: m.DebugPanel })),
);

function ActiveModuleView() {
  const activeModule = useCanvasStore((s) => s.activeModule);

  switch (activeModule) {
    case "paint":
      return <PaintingView />;
    case "sculpt-3d":
      return <SculptingView />;
    case "ai":
      return <AIGenerationView />;
    case "animate":
      return <AnimationView />;
    case "audio":
      return <MusicView />;
    case "write":
      return <MasterWorkspaceView />;
    case "codeart":
      return <CodeArtView />;
    case "photo":
      return <CollabView />;
    default:
      return <PaintingView />;
  }
}

export function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const loadProject = useCanvasStore((s) => s.loadProject);
  const showDebug = useCanvasStore((s) => s.showDebug);

  useEffect(() => {
    if (projectId) loadProject(projectId);
  }, [projectId, loadProject]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "D") {
        e.preventDefault();
        useCanvasStore.getState().toggleDebug();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background: "#12121f",
      }}
    >
      <TopNavBar />
      <SideNavBar />
      <ErrorBoundary>
        <ActiveModuleView />
      </ErrorBoundary>
      <BottomNavBar />

      {showDebug && (
        <Suspense fallback={null}>
          <DebugPanel />
        </Suspense>
      )}
    </div>
  );
}
