import type { Material } from "@/lib/materials";
import { createStore } from "@/lib/store";

/** Simulated uploads, kept in this browser only. Only a file's name and size are stored. */
const uploadsStore = createStore<Material[]>("ast.uploads.v1");

export const useUploads = uploadsStore.useValue;

export function addUpload(material: Material) {
  uploadsStore.write([material, ...(uploadsStore.read() ?? [])]);
}

export function updateUpload(id: string, patch: Partial<Material>) {
  uploadsStore.write(
    (uploadsStore.read() ?? []).map((material) =>
      material.id === id ? { ...material, ...patch } : material,
    ),
  );
}

/** A sample material or an upload by id. "loading" until the browser has been read. */
export function useMaterial(id: string, samples: Material[]): Material | null | "loading" {
  const uploads = useUploads();
  if (uploads === "loading") return "loading";
  return [...(uploads ?? []), ...samples].find((material) => material.id === id) ?? null;
}
