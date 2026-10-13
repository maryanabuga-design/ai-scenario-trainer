"use client";

import { useEffect } from "react";
import { trackInputModality } from "@/lib/input-modality";

/** Shows the focus ring for the keyboard only (see DESIGN.md: Focus). Renders nothing. */
export function InputModality() {
  useEffect(() => trackInputModality(document), []);
  return null;
}
