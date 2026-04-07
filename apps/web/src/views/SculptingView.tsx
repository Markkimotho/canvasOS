import { Sculpt3DPanel } from "@canvasos/sculpt-3d";

export function SculptingView() {
  return (
    <main className="ml-16 mt-12 mb-12 h-[calc(100vh-6rem)] overflow-hidden bg-surface-container-lowest">
      <Sculpt3DPanel />
    </main>
  );
}
