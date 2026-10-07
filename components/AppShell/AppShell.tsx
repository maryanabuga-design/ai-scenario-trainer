import type { ReactNode } from "react";
import { Footer } from "@/components/Footer/Footer";
import { SideNav } from "@/components/SideNav/SideNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-8 md:px-8 md:py-12">
          <div className="mx-auto w-full max-w-reading">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
