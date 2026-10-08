export type Direction = {
  id: string;
  title: string;
  available: boolean;
};

export const directions: Direction[] = [
  { id: "building-evacuation", title: "Building evacuation and first aid", available: true },
  { id: "road-incident", title: "Road incident first aid", available: false },
  { id: "flood", title: "Flood preparedness", available: false },
  { id: "crisis-communication", title: "Crisis communication", available: false },
];

export const defaultDirection = directions[0];

export function directionTitle(id: string | undefined) {
  return (directions.find((direction) => direction.id === id) ?? defaultDirection).title;
}
