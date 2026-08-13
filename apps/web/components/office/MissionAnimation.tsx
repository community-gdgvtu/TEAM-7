"use client";

import type { WorkerState } from "./OfficeLocation";

/**
 * Pixel-art status bubbles floating above worker agents during mission steps.
 */
export function MissionAnimation({
  state,
  lastText,
  lastRole,
}: {
  state: WorkerState;
  lastText?: string;
  lastRole?: "us" | "them";
}) {
  if (state === "idle") return null;

  return (
    <div className="mission-notify" data-state={state}>
      {state === "walking" ? (
        <span className="notify-bubble walk-bubble">
          <span className="dot-led" /> ON THE MOVE...
        </span>
      ) : state === "working" ? (
        <span className="notify-bubble work-bubble">
          {lastRole === "them" ? (
            <>
              THINKING...{" "}
              <span className="mini-dots">
                <i />
                <i />
                <i />
              </span>
            </>
          ) : (
            <>WORKING...</>
          )}
        </span>
      ) : state === "thinking" ? (
        <span className="notify-bubble think-bubble">
          ANALYZING QUOTE...
        </span>
      ) : state === "success" ? (
        <span className="notify-bubble success-bubble">
          MISSION COMPLETE ✓
        </span>
      ) : state === "waiting" ? (
        <span className="notify-bubble wait-bubble">STANDBY</span>
      ) : null}
    </div>
  );
}
