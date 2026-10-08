import { Suspense } from "react";

/** Uploaded materials have ids only known in the browser, so this route reads its id at request time. */
export default function MaterialLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
