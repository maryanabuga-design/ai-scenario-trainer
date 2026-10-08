import { Suspense } from "react";

/** Uploaded materials have ids only known in the browser, so these routes read the id at request time. */
export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
