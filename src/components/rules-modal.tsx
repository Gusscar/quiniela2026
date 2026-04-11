'use client';

import { useState } from 'react';

const rules = [
  {
    pts: 3,
    color: 'bg-green-600 text-white',
    title: 'Marcador exacto',
    desc: 'Aciertas los goles exactos de ambos equipos.',
    example: 'Predices 2-1 → termina 2-1',
  },
  {
    pts: 2,
    color: 'bg-blue-600 text-white',
    title: 'Ganador correcto',
    desc: 'Aciertas el equipo ganador pero el marcador no.',
    example: 'Predices 2-1 → termina 3-1',
  },
  {
    pts: 1,
    color: 'bg-yellow-500 text-white',
    title: 'Empate sin marcador',
    desc: 'Predices empate, hay empate, pero diferente marcador.',
    example: 'Predices 1-1 → termina 0-0',
  },
  {
    pts: 0,
    color: 'bg-muted text-muted-foreground',
    title: 'Incorrecto',
    desc: 'No aciertas el resultado del partido.',
    example: '',
  },
];

export function RulesModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition px-2 py-1 rounded-lg hover:bg-secondary"
        title="Ver reglas de puntuación"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2}/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4m0-4h.01"/>
        </svg>
        Reglas
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-bold text-lg">Sistema de puntos</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="px-5 pb-5 space-y-3">
              {rules.map((r) => (
                <div key={r.pts} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${r.color}`}>
                    {r.pts}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                    {r.example && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5 italic">{r.example}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
