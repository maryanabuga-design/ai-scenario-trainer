import { createStore } from "@/lib/store";
import type { Training, TrainingChoice, Trainings } from "@/lib/training";
import { withTraining } from "@/lib/training";

/** Created trainings per material. Kept in this browser. */
const trainingsStore = createStore<Trainings>("ast.trainings.v1");

export const useTrainings = trainingsStore.useValue;

export function saveTraining(training: Training) {
  trainingsStore.write(withTraining(trainingsStore.read(), training));
}

export function clearTrainings() {
  trainingsStore.write(null);
}

/** The choice made on Create training, waiting for the simulated generation to finish. */
const pendingStore = createStore<TrainingChoice & { materialId: string }>(
  "ast.pending-training.v1",
);

export const usePendingTraining = pendingStore.useValue;

export function setPendingTraining(materialId: string, choice: TrainingChoice) {
  pendingStore.write({ materialId, ...choice });
}

export function clearPendingTraining() {
  pendingStore.write(null);
}
