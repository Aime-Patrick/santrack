import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { OrgGuard } from "@/components/auth/org-guard";
import { PasswordChangeGuard } from "@/components/auth/password-change-guard";
import { RouteGuard } from "@/components/auth/route-guard";
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
          <DashboardHeader />

          <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
            <PasswordChangeGuard>
              <OrgGuard>
                <RouteGuard>{children}</RouteGuard>
              </OrgGuard>
            </PasswordChangeGuard>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <RoleSwitcher />
    </DesignModeProvider>
  );
}
