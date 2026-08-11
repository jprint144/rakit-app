import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getAllWebviews, getCurrentWebview, Webview } from "@tauri-apps/api/webview";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
export default function ReferencePage() {
  const [error, setError] = useState("");
  const [activeUrl, setActiveUrl] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const browserRef = useRef<HTMLDivElement>(null);
  const nativeViewRef = useRef<Webview | null>(null);
  const closeReferenceWebviews = useCallback(async () => {
    const views = (await getAllWebviews()).filter((view) =>
      view.label.startsWith("reference-content-"),
    );
    nativeViewRef.current = null;
    await Promise.allSettled(views.map((view) => view.hide()));
    await Promise.allSettled(views.map((view) => view.close()));
  }, []);
  useEffect(() => {
    const openSettings = async () => {
      setSettingsVisible(true);
      const browserViews = (await getAllWebviews()).filter((view) =>
        view.label.startsWith("reference-content-"),
      );
      await Promise.allSettled(browserViews.map((view) => view.hide()));
      const label = "reference-settings-overlay";
      const existing = await Webview.getByLabel(label);
      if (existing) {
        await existing.show();
        await existing.setFocus();
        return;
      }
      const width = Math.min(448, window.innerWidth);
      const height = window.innerHeight;
      const popup = new Webview(getCurrentWebviewWindow(), label, {
        url: new URL("#/reference-settings", window.location.href).href,
        x: Math.max(0, window.innerWidth - width),
        y: 0,
        width,
        height,
      });
      popup.once("tauri://error", (event) => setError(String(event.payload)));
    };
    window.addEventListener("reference:settings", openSettings);
    return () => window.removeEventListener("reference:settings", openSettings);
  }, []);
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void getCurrentWebview().listen("reference:settings-closed", async () => {
      setSettingsVisible(false);
      const browserViews = (await getAllWebviews()).filter((view) =>
        view.label.startsWith("reference-content-"),
      );
      await Promise.allSettled(browserViews.map((view) => view.show()));
    }).then((stop) => { unlisten = stop; });
    return () => unlisten?.();
  }, []);
  useEffect(() => {
    const navigate = async (event: Event) => {
      setActiveUrl("");
      await closeReferenceWebviews();
      setActiveUrl((event as CustomEvent<string>).detail);
    };
    window.addEventListener("reference:navigate", navigate);
    return () => window.removeEventListener("reference:navigate", navigate);
  }, [closeReferenceWebviews]);
  useLayoutEffect(() => { if (!activeUrl || !browserRef.current) return; const resize = () => { const rect = browserRef.current?.getBoundingClientRect(); const view = nativeViewRef.current; if (rect && view) { const top = rect.top + 2; view.setPosition(new LogicalPosition(rect.left + 2, top)).then(() => view.setSize(new LogicalSize(rect.width - 4, rect.height - 4))).catch((cause) => setError(String(cause))); } }; const rect = browserRef.current.getBoundingClientRect(); const view = new Webview(getCurrentWebviewWindow(), `reference-content-${Date.now()}`, { url: activeUrl, x: rect.left + 2, y: rect.top + 2, width: rect.width - 4, height: rect.height - 4 }); nativeViewRef.current = view; view.once("tauri://created", resize); view.once("tauri://error", (event) => setError(String(event.payload))); const observer = new ResizeObserver(resize); observer.observe(browserRef.current); return () => { observer.disconnect(); nativeViewRef.current = null; void view.hide().catch(console.error); void view.close().catch(console.error); }; }, [activeUrl]);
  return (
    <div className="flex flex-1 flex-col p-0">
      <div className="flex flex-1">
        <div ref={browserRef} className="relative flex flex-1">{!activeUrl && <div className="flex flex-1 items-center justify-center text-muted-foreground">Pilih website dari subsidebar untuk membuka browser.</div>}{error && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-destructive">{error}</p>}{settingsVisible && <div className="absolute inset-0 bg-black/50" />}</div>
      </div>
    </div>
  );
}
