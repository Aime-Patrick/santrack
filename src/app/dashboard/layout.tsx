import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { OrgGuard } from "@/components/auth/org-guard";
import { PasswordChangeGuard } from "@/components/auth/password-change-guard";
import { RouteGuard } from "@/components/auth/route-guard";
import { DesignModeProvider } from "@/components/providers/design-mode-provider";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { WorkflowBar } from "@/components/layout/workflow-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DesignModeProvider>
      <PasswordChangeGuard>
        <OrgGuard>
          <SidebarProvider defaultOpen={true} className="h-svh overflow-hidden bg-background">
            <AppSidebar />
            <SidebarInset className="relative flex h-svh min-h-0 flex-1 flex-col overflow-hidden bg-card">
              <div className="shrink-0">
                <DashboardHeader />
                <WorkflowBar />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-card p-3 md:p-4">
                <RouteGuard>{children}</RouteGuard>
              </div>
            </SidebarInset>
          </SidebarProvider>

          <RoleSwitcher />
        </OrgGuard>
      </PasswordChangeGuard>
    </DesignModeProvider>
  );
}
