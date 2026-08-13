"use client";

import { useMemo, useRef } from "react";
import type { Line } from "@/lib/types";
import type { WorkerAgent, WorkerState } from "./OfficeLocation";
import { WORKER_PROFILES, getDeskLocation } from "./workerData";

/**
 * State machine hook managing multiple independent animated worker agents based on live mission lines.
 * Computes worker states synchronously via useMemo to avoid React state re-render loops.
 */
export function useWorkerAnimation(
  lines: Line[],
  briefing: boolean,
  use3js: boolean = false,
  demoMovement: boolean = false
) {
  const prevLineStates = useRef<Map<string, { state: string; turnsCount: number; ended: boolean }>>(new Map());

  return useMemo(() => {
    return lines.map((line, index) => {
      const profile = WORKER_PROFILES[index % WORKER_PROFILES.length];
      const homeLoc = getDeskLocation(index);

      // Current line metrics
      const turnsCount = line.turns.length;
      const lineState = line.state;
      const ended = line.ended;
      const dead = line.dead;
      const working = !ended && turnsCount > 0;
      const isThinking = line.lastRole === "them" && !ended;

      // Previous tracked metrics
      const prev = prevLineStates.current.get(line.cp.id);
      const isNewMission = briefing && (!prev || prev.turnsCount === 0);
      const justEndedSuccess = ended && line.outcome === "closed" && prev && !prev.ended;

      let newState: WorkerState = "idle";
      const newPos = { x: homeLoc.x, y: homeLoc.y };
      let targetPos: { x: number; y: number } | undefined = undefined;

      if (demoMovement) {
        // Cycle through states based on desk index for full worker movement demonstration
        const states: WorkerState[] = ["walking", "working", "thinking", "success"];
        newState = states[index % states.length];
        if (newState === "walking") {
          targetPos = { x: homeLoc.x + 10, y: homeLoc.y - 10 };
        }
      } else if (dead) {
        newState = "waiting";
      } else if (justEndedSuccess) {
        newState = "success";
      } else if (isThinking) {
        newState = "thinking";
      } else if (working) {
        newState = "working";
      } else if (isNewMission) {
        newState = "walking";
        targetPos = { x: homeLoc.x, y: homeLoc.y };
      } else if (ended) {
        newState = "idle";
      } else {
        newState = "idle";
      }

      // Update tracking reference
      prevLineStates.current.set(line.cp.id, { state: lineState, turnsCount, ended });

      return {
        id: `agent-${profile.id}-${index}`,
        name: profile.name,
        role: profile.role,
        image: profile.image,
        home: { x: homeLoc.x, y: homeLoc.y },
        position: newPos,
        target: targetPos,
        state: newState,
        missionId: line.cp.id,
        deskIndex: index,
        use3js,
        vector3D: { x: newPos.x, y: newPos.y, z: index * 10 },
      };
    });
  }, [lines, briefing, use3js, demoMovement]);
}
