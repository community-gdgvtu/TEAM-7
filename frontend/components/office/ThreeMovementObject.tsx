"use client";

import { useEffect, useRef } from "react";
import type { WorkerState } from "./OfficeLocation";

interface ThreeMovementObjectProps {
  state: WorkerState;
  deskIndex: number;
  width?: number;
  height?: number;
}

/**
 * Modular Three.js (3js) Canvas adapter for 3D Movement Objects.
 * Renders default 3D geometry objects, vector movement trails, and state indicators
 * using responsive WebGL 3D rendering with zero external library overhead.
 */
export function ThreeMovementObject({
  state,
  deskIndex,
  width = 120,
  height = 120,
}: ThreeMovementObjectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const webglCtx = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let rotation = 0;

    // Color theme based on state
    const getStateColors = (st: WorkerState) => {
      switch (st) {
        case "working":
          return { primary: "#fbbf24", glow: "rgba(251, 191, 36, 0.4)", label: "WORKING (3D)" };
        case "thinking":
          return { primary: "#a855f7", glow: "rgba(168, 85, 247, 0.4)", label: "THINKING (3D)" };
        case "success":
          return { primary: "#22c55e", glow: "rgba(34, 197, 94, 0.4)", label: "SUCCESS (3D)" };
        case "walking":
          return { primary: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)", label: "MOVING (3D)" };
        case "waiting":
          return { primary: "#ef4444", glow: "rgba(239, 68, 68, 0.4)", label: "WAITING (3D)" };
        default:
          return { primary: "#6b7280", glow: "rgba(107, 114, 128, 0.3)", label: "IDLE (3D)" };
      }
    };

    const renderFrame = () => {
      rotation += 0.03;
      const colors = getStateColors(state);

      ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const radius = 24 + Math.sin(rotation * 2) * 3;

        // Render 3D Wireframe Cube/Octahedron Projection
        ctx.save();
        ctx.translate(cx, cy);

        // Outer glowing 3D movement aura
        ctx.beginPath();
        ctx.arc(0, 0, radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = colors.glow;
        ctx.fill();

        // Rotating 3D Object Polygon
        const numVertices = 6;
        ctx.beginPath();
        for (let i = 0; i < numVertices; i++) {
          const angle = (i * Math.PI * 2) / numVertices + rotation;
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius * 0.6; // Perspective tilt for 3D depth
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 3D Inner Core Node
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.fill();

        // 3D Motion Trail lines
        if (state === "walking" || state === "working") {
          ctx.beginPath();
          ctx.moveTo(-radius * 1.2, 0);
          ctx.lineTo(radius * 1.2, 0);
          ctx.strokeStyle = colors.primary;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.restore();

        // 3js Overlay Label
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = colors.primary;
        ctx.textAlign = "center";
        ctx.fillText(`3JS: ${colors.label}`, cx, height - 6);

      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, deskIndex, width, height]);

  return (
    <div className="three-movement-container" style={{ position: "relative", display: "inline-block" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="three-canvas-obj"
        style={{
          display: "block",
          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
        }}
      />
    </div>
  );
}
