import { Suspense } from "react";
import type { ReactNode } from "react";
import { ActionBarProvider, ActionBarSlot } from "@/components/ActionBar/ActionBar";
import { AuthGate } from "@/components/AuthGate/AuthGate";
import { RestartShortcut } from "@/components/RestartShortcut/RestartShortcut";
import { NavigationTracker } from "@/components/NavigationTracker/NavigationTracker";
import { RouteTitle } from "@/components/ShellChrome/RouteTitle";
import { ShellChrome } from "@/components/ShellChrome/ShellChrome";
import { BottomNav } from "@/components/BottomNav/BottomNav";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      data-shell-frame
      className="group/shell mx-auto flex min-h-dvh w-full max-w-app flex-col border-border bg-bg min-[431px]:border-x pt-[env(safe-area-inset-top)] has-[[data-shell=instructor]]:desk:max-w-none has-[[data-shell=instructor]]:desk:flex-row has-[[data-shell=instructor]]:desk:border-x-0"
    >
      <Suspense fallback={null}>
        <ShellChrome />
        <RouteTitle />
      </Suspense>
      <Suspense fallback={null}>
        <NavigationTracker />
        <RestartShortcut />
      </Suspense>
      <SourceSheetProvider sections={loadAllSections()}>
        <ActionBarProvider>
          <div className="contents group-has-[[data-shell=instructor]]/shell:desk:flex group-has-[[data-shell=instructor]]/shell:desk:min-w-0 group-has-[[data-shell=instructor]]/shell:desk:flex-1 group-has-[[data-shell=instructor]]/shell:desk:flex-col group-has-[[data-shell=instructor]]/shell:desk:[--gutter:2rem]">
            <main
              id="main-content"
              className="flex flex-1 flex-col px-[var(--gutter,1rem)] pt-6 group-has-[[data-shell=instructor]]/shell:desk:mx-auto group-has-[[data-shell=instructor]]/shell:desk:w-full group-has-[[data-shell=instructor]]/shell:desk:max-w-[1200px]"
            >
              <Suspense fallback={null}>
                <AuthGate>{children}</AuthGate>
              </Suspense>
            </main>
            <div
              data-full-bleed
              className="sticky bottom-0 z-10 bg-bg pb-[env(safe-area-inset-bottom)] group-has-[[data-shell=instructor]]/shell:desk:mx-auto group-has-[[data-shell=instructor]]/shell:desk:w-full group-has-[[data-shell=instructor]]/shell:desk:max-w-[1200px] group-has-[[data-shell=instructor]]/shell:desk:[&>nav]:hidden"
            >
              <ActionBarSlot />
              <Suspense fallback={null}>
                <BottomNav />
              </Suspense>
            </div>
          </div>
        </ActionBarProvider>
      </SourceSheetProvider>
    </div>
  );
}
