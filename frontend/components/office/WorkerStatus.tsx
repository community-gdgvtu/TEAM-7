"use client";

import type { WorkerAgent } from "./OfficeLocation";

/**
 * Pixel-art status card rendered on hover/click of a worker agent.
 */
export function WorkerStatus({
  worker,
  cpName,
}: {
  worker: WorkerAgent;
  cpName?: string;
}) {
  return (
    <div className="worker-status-card px-panel">
      <div className="status-head">
        <span className="worker-name">{worker.name}</span>
        <span className="worker-role">{worker.role}</span>
      </div>

      <div className="status-body">
        <div className="status-row">
          <span className="px-label">STATUS</span>
          <span className="status-badge" data-state={worker.state}>
            {worker.state.toUpperCase()}
          </span>
        </div>

        {cpName ? (
          <div className="status-row">
            <span className="px-label">TARGET</span>
            <span className="target-val">{cpName}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
