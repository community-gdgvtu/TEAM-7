/**
 * Worker animation system types.
 *
 * Positions are expressed as percentage coordinates relative to the `.office`
 * container — responsive by design, never fixed pixel values.
 */

export type WorkerState =
  | "idle"
  | "walking"
  | "working"
  | "thinking"
  | "success"
  | "waiting";

export interface Position {
  /** Percentage from left edge of the .office container */
  x: number;
  /** Percentage from top edge of the .office container */
  y: number;
}

export interface OfficeLocation extends Position {
  label: string;
}

export interface WorkerAgent {
  id: string;
  name: string;
  role: string;
  image: string;

  /** Home position — where this worker rests when idle */
  home: Position;

  /** Current rendered position (where the PNG is right now) */
  position: Position;

  /** Destination position (if walking) */
  target?: Position;

  state: WorkerState;

  /** Which mission / counterparty id this worker is handling */
  missionId?: string;

  /** Which desk index this worker occupies */
  deskIndex: number;

  /** Optional flag enabling 3js / Three.js 3D movement object rendering */
  use3js?: boolean;

  /** Optional 3D spatial coordinate vector for Three.js objects */
  vector3D?: { x: number; y: number; z: number };
}

export interface WorkerProfile {
  id: string;
  name: string;
  role: string;
  image: string;
}
