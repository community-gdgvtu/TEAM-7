"use client";

import { useState } from "react";
import type { WorkerAgent as WorkerAgentType } from "./OfficeLocation";
import { WorkerStatus } from "./WorkerStatus";
import { MissionAnimation } from "./MissionAnimation";
import { ThreeMovementObject } from "./ThreeMovementObject";

export function WorkerAgent({
  worker,
  cpName,
  lastText,
  lastRole,
}: {
  worker: WorkerAgentType;
  cpName?: string;
  lastText?: string;
  lastRole?: "us" | "them";
}) {
  const [hovered, setHovered] = useState(false);

  // Determine facing direction (if target is to the left of current position, flip horizontally)
  const isFacingLeft = worker.target ? worker.target.x < worker.position.x : false;

  return (
    <div
      className="worker-agent-wrap"
      data-state={worker.state}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Floating Status Notification Bubble */}
      <MissionAnimation state={worker.state} lastText={lastText} lastRole={lastRole} />

      {/* Worker Sprite Container with Pixel Rendering & Animation */}
      <div
        className="worker-sprite-box"
        style={{
          transform: isFacingLeft ? "scaleX(-1)" : "none",
        }}
      >
        {worker.use3js ? (
          <ThreeMovementObject
            state={worker.state}
            deskIndex={worker.deskIndex}
            width={120}
            height={120}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={worker.image}
            alt={`${worker.name} - ${worker.role}`}
            className="worker-sprite-img"
          />
        )}
      </div>

      {/* Agent Name Tag */}
      <span className="px-plate plate">
        {cpName ? shortName(cpName) : worker.name}
      </span>

      {/* Hover Status Card */}
      {hovered ? <WorkerStatus worker={worker} cpName={cpName} /> : null}
    </div>
  );
}

function shortName(name: string): string {
  if (name.length <= 16) return name;
  const cut = name.slice(0, 16);
  const space = cut.lastIndexOf(" ");
  return (space > 6 ? cut.slice(0, space) : cut) + "…";
}
