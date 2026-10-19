import { Suspense } from "react";
import type { ReactNode } from "react";
import { ActionBarProvider, ActionBarSlot } from "@/components/ActionBar/ActionBar";
import { AuthGate } from "@/components/AuthGate/AuthGate";
import { NavigationTracker } from "@/components/NavigationTracker/NavigationTracker";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col border-border bg-bg min-[431px]:border-x pt-[env(safe-area-inset-top)]">
      <Suspense fallback={null}>
        <NavigationTracker />
      </Suspense>
      <SourceSheetProvider sections={loadAllSections()}>
        <ActionBarProvider>
          <main className="flex flex-1 flex-col px-[var(--gutter,1rem)] pt-6">
            <Suspense fallback={null}>
              <AuthGate>{children}</AuthGate>
            </Suspense>
          </main>
          <div
            data-full-bleed
            className="sticky bottom-0 z-10 bg-bg pb-[env(safe-area-inset-bottom)]"
          >
            <ActionBarSlot />
            <Suspense fallback={null}>
              <BottomNav />
            </Suspense>
          </div>
        </ActionBarProvider>
      </SourceSheetProvider>
    </div>
  );
}
