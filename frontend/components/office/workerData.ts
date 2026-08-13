import type { OfficeLocation, WorkerProfile } from "./OfficeLocation";

/**
 * Default worker profiles.
 * To add a new worker, simply add an entry here with a PNG image path in /public!
 */
export const WORKER_PROFILES: WorkerProfile[] = [
  {
    id: "worker-1",
    name: "Ravi",
    role: "Lead Negotiator",
    image: "/game/worker-1.png",
  },
  {
    id: "worker-2",
    name: "Ananya",
    role: "Market Analyst",
    image: "/game/worker-2.png",
  },
  {
    id: "worker-3",
    name: "Vikram",
    role: "Bazaar Scout",
    image: "/game/worker-3.png",
  },
  {
    id: "worker-4",
    name: "Priya",
    role: "Deal Strategist",
    image: "/game/worker-1.png",
  },
];

/**
 * 2D Office Location Map (in percentages relative to the .office container).
 * Desk coordinates align directly with the FOUR_DESKS constants in Office.tsx.
 */
export const OFFICE_LOCATIONS: Record<string, OfficeLocation> = {
  desk1: { label: "Desk 1", x: 32, y: 62 },
  desk2: { label: "Desk 2", x: 68, y: 62 },
  desk3: { label: "Desk 3", x: 22, y: 88 },
  desk4: { label: "Desk 4", x: 78, y: 88 },
  manager: { label: "Manager Desk", x: 50, y: 92 },
  printer: { label: "Printer & Telefax", x: 86, y: 36 },
  meetingRoom: { label: "Strategy Table", x: 50, y: 28 },
  missionBoard: { label: "Bhav Mission Board", x: 14, y: 36 },
  entrance: { label: "Office Entrance", x: 50, y: 50 },
};

/**
 * Returns default desk location by index.
 */
export function getDeskLocation(index: number): OfficeLocation {
  const keys = ["desk1", "desk2", "desk3", "desk4"];
  const key = keys[index % keys.length];
  return OFFICE_LOCATIONS[key] ?? { label: `Desk ${index + 1}`, x: 32, y: 62 };
}
