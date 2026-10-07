import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { Footer } from "@/components/Footer/Footer";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col border-x border-border bg-bg pt-[env(safe-area-inset-top)]">
      <SourceSheetProvider>
        <main className="flex-1 px-4 pt-6">{children}</main>
        <Footer />
        <BottomNav />
      </SourceSheetProvider>
    </div>
  );
}
