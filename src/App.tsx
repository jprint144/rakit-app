import { useEffect } from "react";
import { UpdateNotification } from "@/components/update-notification";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar";
import { verifyDatabaseConnection } from "@/lib/database";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
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
import ArchivePage from "@/pages/archive";
import SettingsPage from "@/pages/settings";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/project": "Project",
  "/finance": "Finance",
  "/invoice": "Invoice",
  "/idea": "Idea",
  "/reference": "Reference",
  "/archive": "Archive",
  "/settings": "Settings",
};

function AppShell() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? "Rakit";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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
        </header>
        <div className="flex flex-1 flex-col">
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
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function App() {
  useEffect(() => {
    verifyDatabaseConnection().catch((error: unknown) => {
      console.error("SQLite startup check failed:", error);
    });
  }, []);

  return (
    <>
      <UpdateNotification />
      <HashRouter>
      <AppShell />
    </HashRouter>
    </>
  );
}
