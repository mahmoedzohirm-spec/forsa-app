import { useState, useEffect } from "react";

export const Confetti = ({ active }: { active: boolean }) => {
  const [particles, setParticles] = useState<
    Array<{ id: number; left: number; delay: number; color: string; size: number; shape: "circle" | "square" }>
  >([]);

  useEffect(() => {
    if (!active) {
      setTimeout(() => setParticles([]), 0);
      return;
    }
    const colors = ["#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#3b82f6", "#fbbf24", "#a78bfa"];
    const newParticles = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6,
      shape: Math.random() > 0.5 ? ("circle" as const) : ("square" as const),
    }));
    setTimeout(() => setParticles(newParticles), 0);
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${Math.random() * 2 + 2}s`,
          }}
        />
      ))}
    </div>
  );
};