"use client";

import { createContext, useContext } from "react";

/** True inside a selected SelectableCard, so the chips in it can turn primary. */
const SelectedContext = createContext(false);

export const SelectedProvider = SelectedContext.Provider;

export function useCardSelected() {
  return useContext(SelectedContext);
}
