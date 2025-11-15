import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b border-border flex items-center px-4 md:hidden">
            <SidebarTrigger />
          </header>
          {/* 💡 FIX: Add min-h-0 to the <main> tag */}
          <main className="flex-1 overflow-auto min-h-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}