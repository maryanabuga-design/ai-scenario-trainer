import type { Material } from "@/lib/materials";
import { createStore } from "@/lib/store";

/** Simulated uploads, kept in this browser only. Only a file's name and size are stored. */
const uploadsStore = createStore<Material[]>("ast.uploads.v1");

export const useUploads = uploadsStore.useValue;

export function addUpload(material: Material) {
  uploadsStore.write([material, ...(uploadsStore.read() ?? [])]);
}
