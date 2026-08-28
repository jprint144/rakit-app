import { useEffect } from "react";
import { useState } from "react";
import { getAllWebviews } from "@tauri-apps/api/webview";
import { UpdateNotification } from "@/components/update-notification";
import { DailyTaskReminder } from "@/features/tugas-harian/daily-task-reminder";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { LoginForm } from "@/components/login-form";
import { supabase } from "@/lib/supabase";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { syncRakitEditableData } from "@/features/sync/supabase-sync";
import { verifyDatabaseConnection } from "@/lib/database";
import { loadTheme } from "@/features/settings/settings-repository";
import { syncWindowIcon } from "@/lib/window-icon";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Minus, Settings2, Square, X } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import DashboardPage from "@/pages/dashboard";
import ProjectPage from "@/pages/project";
import FinancePage from "@/pages/finance";
import InvoicePage from "@/pages/invoice";
import IdeaPage from "@/pages/idea";
import ReferencePage from "@/pages/reference";
import { ReferenceSubsidebar } from "@/features/reference/reference-subsidebar";
import ArchivePage from "@/pages/archive";
import SettingsPage from "@/pages/settings";
import DailyTasksPage from "@/pages/daily-tasks";
import JobApplicationsPage from "@/pages/job-applications";
import HabitTrackerPage from "@/pages/habit-tracker";
import TargetPage from "@/pages/target";
import ReferenceSettingsOverlayPage from "@/pages/reference-settings-overlay";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/project": "Project",
  "/finance": "Finance",
  "/invoice": "Invoice",
  "/idea": "Idea",
  "/reference": "Reference",
  "/archive": "Archive",
  "/settings": "Settings",
  "/tugas-harian": "Tugas Harian",
  "/lamar-pekerjaan": "Lamar Pekerjaan",
  "/habit-tracker": "Habit Tracker",
  "/target": "Target",
};

function WindowTitleBar() {
  const currentWindow = getCurrentWindow();
  const maximize = () => currentWindow.toggleMaximize();
  const startDrag = (event: React.MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || event.detail > 1) return;
    void currentWindow.startDragging();
  };
  const handleWindowAction = (event: React.MouseEvent<HTMLButtonElement>, action: () => Promise<void>) => {
    event.preventDefault();
    event.stopPropagation();
    void action();
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 hidden h-9 select-none items-center bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex min-w-(--sidebar-width) items-center gap-2 self-stretch px-3 text-sm" onMouseDown={startDrag} onDoubleClick={() => void maximize()}>
        <img src="/branding/rakit-logo.png" alt="" className="size-4 brightness-0 invert" />
        <span className="font-semibold">Rakit</span>
      </div>
      <div className="min-w-0 flex-1 self-stretch" onMouseDown={startDrag} onDoubleClick={() => void maximize()} />
      <div className="flex items-center justify-end self-stretch">
        <button className="grid h-9 w-11 place-items-center hover:bg-sidebar-accent" type="button" aria-label="Minimize" onMouseDown={(event) => event.stopPropagation()} onClick={(event) => handleWindowAction(event, () => currentWindow.minimize())}>
          <Minus className="size-4" />
        </button>
        <button className="grid h-9 w-11 place-items-center hover:bg-sidebar-accent" type="button" aria-label="Maximize" onMouseDown={(event) => event.stopPropagation()} onClick={(event) => handleWindowAction(event, () => currentWindow.toggleMaximize())}>
          <Square className="size-3.5" />
        </button>
        <button className="grid h-9 w-11 place-items-center hover:bg-destructive hover:text-destructive-foreground" type="button" aria-label="Close" onMouseDown={(event) => event.stopPropagation()} onClick={(event) => handleWindowAction(event, () => currentWindow.close())}>
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

async function handleAuthCallback(url: string) {
  if (!url.startsWith("rakit://auth/callback")) return;
  const fragment = url.split("#")[1];
  if (!fragment) return;
  const params = new URLSearchParams(fragment);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
}

function AppShell() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? "Rakit";
  const [referenceFocusMode, setReferenceFocusMode] = useState(false);
  const [referenceHeaderHidden, setReferenceHeaderHidden] = useState(false);

  useEffect(() => {
    const toggleFocusMode = (event: Event) => setReferenceFocusMode((event as CustomEvent<boolean>).detail);
    window.addEventListener("reference:focus-mode", toggleFocusMode);
    return () => window.removeEventListener("reference:focus-mode", toggleFocusMode);
  }, []);

  useEffect(() => {
    setReferenceHeaderHidden(pathname === "/reference");
  }, [pathname]);

  useEffect(() => {
    const showHeader = () => setReferenceHeaderHidden(false);
    window.addEventListener("reference:show-header", showHeader);
    return () => window.removeEventListener("reference:show-header", showHeader);
  }, []);

  useEffect(() => {
    const hideHeader = () => setReferenceHeaderHidden(true);
    window.addEventListener("reference:hide-header", hideHeader);
    return () => window.removeEventListener("reference:hide-header", hideHeader);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("reference:header-hidden", { detail: referenceHeaderHidden }));
  }, [referenceHeaderHidden]);

  useEffect(() => {
    if (pathname === "/reference") return;

    setReferenceFocusMode(false);
    setReferenceHeaderHidden(false);

    void getAllWebviews().then(async (webviews) => {
      const referenceWebviews = webviews.filter(
        (webview) => webview.label.startsWith("reference-content-") || webview.label === "reference-settings-overlay",
      );
      await Promise.allSettled(referenceWebviews.map((webview) => webview.hide()));
      await Promise.allSettled(referenceWebviews.map((webview) => webview.close()));
    });
  }, [pathname]);

  return (
    <>
    <WindowTitleBar />
    <SidebarProvider className="md:min-h-svh md:pt-9">
      {!referenceFocusMode && <AppSidebar />}
      <SidebarInset className={cn(referenceFocusMode && "ml-0", !referenceFocusMode && "pb-16 md:pb-0")}>
        {!referenceFocusMode && !(pathname === "/reference" && referenceHeaderHidden) && <header className={cn("sticky top-0 z-30 flex min-h-16 shrink-0 items-center gap-2 border-b bg-background px-4 pt-7 pb-2 md:h-16 md:py-0", (pathname === "/tugas-harian" || pathname === "/idea") && "hidden md:flex")}>
          <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
          <Separator
            orientation="vertical"
            className="mr-2 hidden data-[orientation=vertical]:h-4 md:block"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {pathname === "/reference" && (
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => window.dispatchEvent(new Event("reference:settings"))}>
                <Settings2 data-icon="inline-start" />Pengaturan
              </Button>
            </div>
          )}
        </header>}
        <div className="flex flex-1">
          {pathname === "/reference" && <ReferenceSubsidebar />}
          <div className="flex min-w-0 flex-1 flex-col">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/project" element={<ProjectPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/finance/keuangan" element={<FinancePage />} />
            <Route path="/invoice" element={<InvoicePage />} />
            <Route path="/idea" element={<IdeaPage />} />
            <Route path="/reference" element={<ReferencePage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/tugas-harian" element={<DailyTasksPage />} />
            <Route path="/lamar-pekerjaan" element={<JobApplicationsPage />} />
            <Route path="/habit-tracker" element={<HabitTrackerPage />} />
            <Route path="/target" element={<TargetPage />} />
          </Routes>
          </div>
        </div>
      </SidebarInset>
      {!referenceFocusMode && <MobileBottomNav />}
    </SidebarProvider>
    </>
  );
}

export default function App() {
  if (window.location.hash === "#/reference-settings") return <ReferenceSettingsOverlayPage />;

  useEffect(() => {
    verifyDatabaseConnection().catch((error: unknown) => {
      console.error("SQLite startup check failed:", error);
    });
    loadTheme().then(async (theme) => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      await syncWindowIcon(theme);
    }).catch(console.error);
  }, []);

  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setAuthenticated(Boolean(data.session)));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setAuthenticated(Boolean(session)));
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void (async () => {
      const current = await getCurrent();
      await Promise.all((current ?? []).map(handleAuthCallback));
      unlisten = await onOpenUrl((urls) => { void Promise.all(urls.map(handleAuthCallback)); });
    })().catch(console.error);
    return () => unlisten?.();
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void syncRakitEditableData().catch(console.warn);
    const interval = window.setInterval(() => void syncRakitEditableData().catch(console.warn), 30_000);
    return () => window.clearInterval(interval);
  }, [authenticated]);

  return (
    <>
      <UpdateNotification />
      <DailyTaskReminder />
      <Toaster />
      {authenticated === null ? <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4"><img src="/branding/rakit-logo.png" alt="" className="size-16 animate-spin brightness-0 invert motion-reduce:animate-none" /><p className="text-sm text-muted-foreground">Memuat Rakit…</p></div> : authenticated ? <HashRouter><AppShell /></HashRouter> : <main className="flex min-h-svh items-center justify-center p-4"><div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm"><LoginForm /></div></main>}
    </>
  );
}
