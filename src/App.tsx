import { useEffect } from "react";
import { useState } from "react";
import { getAllWebviews } from "@tauri-apps/api/webview";
import { UpdateNotification } from "@/components/update-notification";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar";
import { verifyDatabaseConnection } from "@/lib/database";
import { loadTheme } from "@/features/settings/settings-repository";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ChevronUp, Settings2 } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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
};

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
    <SidebarProvider>
      {!referenceFocusMode && <AppSidebar />}
      <SidebarInset className={referenceFocusMode ? "ml-0" : undefined}>
        {!referenceFocusMode && !(pathname === "/reference" && referenceHeaderHidden) && <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
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
              <Button
                size="icon"
                variant="ghost"
                title="Sembunyikan bar atas"
                onClick={() => setReferenceHeaderHidden(true)}
              >
                <ChevronUp />
              </Button>
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
          </Routes>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function App() {
  if (window.location.hash === "#/reference-settings") return <ReferenceSettingsOverlayPage />;

  useEffect(() => {
    verifyDatabaseConnection().catch((error: unknown) => {
      console.error("SQLite startup check failed:", error);
    });
    loadTheme().then((theme) => document.documentElement.classList.toggle("dark", theme === "dark")).catch(console.error);
  }, []);

  return (
    <>
      <UpdateNotification />
      <Toaster />
      <HashRouter>
      <AppShell />
    </HashRouter>
    </>
  );
}
