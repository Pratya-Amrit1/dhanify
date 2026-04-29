import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/web/app-sidebar";
import { DashboardHeader } from "@/components/web/navbar/dashboard-header";
import { DhanifyChatSheet } from "@/components/web/dhanifyAi";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) redirect("/");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 w-full overflow-x-hidden">
          <DashboardHeader />
          <div className="px-4 py-2 sm:px-6">
            <DhanifyChatSheet />
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
