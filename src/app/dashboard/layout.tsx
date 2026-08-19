import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { OrgGuard } from "@/components/auth/org-guard";
import { DesignModeProvider } from "@/components/providers/design-mode-provider";
import { RoleSwitcher } from "@/components/layout/role-switcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DesignModeProvider>
      <SidebarProvider defaultOpen={true} className="min-h-screen bg-[#f8fafc] dark:bg-background p-2 md:p-3">
        <AppSidebar />
        <SidebarInset className="relative flex flex-col flex-1 min-h-[calc(100vh-1.5rem)] rounded-2xl border border-border/80 bg-white shadow-xs overflow-hidden">
          {/* ── Top Header Bar (Inside the rounded main card) ── */}
          <DashboardHeader />

          {/* ── Main Content Area ── */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
            <OrgGuard>{children}</OrgGuard>
          </div>

          {/* ── Imigongo pattern border ── */}
          <div
            className="w-full h-4 shrink-0 bg-repeat-x bg-center"
            style={{
              backgroundImage: "url('/images/imigongo2.png')",
              backgroundSize: "auto 100%",
            }}
          />
        </SidebarInset>
      </SidebarProvider>

      {/* Floating role switcher — only renders in design mode */}
      <RoleSwitcher />
    </DesignModeProvider>
  );
}
