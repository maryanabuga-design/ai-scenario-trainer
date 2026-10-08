import { createStore } from "@/lib/store";
import type { Training, Trainings } from "@/lib/training";
import { withTraining } from "@/lib/training";

/** Created trainings per material, and the one Session setup should use. Kept in this browser. */
const trainingsStore = createStore<Trainings>("ast.trainings.v1");
const activeStore = createStore<string>("ast.active-training.v1");

export const useTrainings = trainingsStore.useValue;
export const useActiveTraining = activeStore.useValue;

export function saveTraining(training: Training) {
  trainingsStore.write(withTraining(trainingsStore.read(), training));
}

export function startTraining(materialId: string) {
  activeStore.write(materialId);
}

export function clearTrainings() {
  trainingsStore.write(null);
  activeStore.write(null);
}
