'use client';

import { useEffect, useState } from 'react';

interface Ball {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

export function Celebration({ active }: { active: boolean }) {
  const [balls, setBalls] = useState<Ball[]>([]);

  useEffect(() => {
    if (!active) { setBalls([]); return; }
    const generated: Ball[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.2 + Math.random() * 1.2,
      size: 20 + Math.random() * 28,
    }));
    setBalls(generated);
  }, [active]);

  if (!active || balls.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {balls.map((b) => (
        <span
          key={b.id}
          className="fly-up absolute bottom-0 select-none"
          style={{
            left: `${b.left}%`,
            fontSize: `${b.size}px`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        >
          ⚽
        </span>
      ))}
    </div>
  );
}
