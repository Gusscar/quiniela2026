'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Match, Prediction } from '@/types';
import { savePrediction } from '@/lib/predictions';
import { isMatchLocked } from '@/lib/matches';

interface PredictionInputProps {
  match: Match;
  prediction?: Prediction;
  userId: string;
  onSave?: () => void;
}

const isKnockout = (match: Match) => !match.group_letter;

export function PredictionInput({ match, prediction, userId, onSave }: PredictionInputProps) {
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!prediction);
  const [goalsA, setGoalsA] = useState<string>(prediction?.goalsA?.toString() ?? '');
  const [goalsB, setGoalsB] = useState<string>(prediction?.goalsB?.toString() ?? '');
  const [advancingTeam, setAdvancingTeam] = useState<'A' | 'B' | null>(prediction?.advancing_team ?? null);
  const locked = isMatchLocked(match);
  const knockout = isKnockout(match);

  const a = parseInt(goalsA);
  const b = parseInt(goalsB);
  const isDraw = !isNaN(a) && !isNaN(b) && a === b;

  const handleSave = async () => {
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      toast.error('Ingresa un marcador válido');
      return;
    }
    if (knockout && isDraw && !advancingTeam) {
      toast.error('Debes seleccionar el equipo que avanza en caso de empate');
      return;
    }
    setSaving(true);
    try {
      await savePrediction(userId, match.id, a, b, knockout && isDraw ? advancingTeam : null);
      toast('⚽ ¡Predicción guardada!', {
        description: `${match.teamA?.name ?? 'Local'} ${a} - ${b} ${match.teamB?.name ?? 'Visitante'}`,
        duration: 3000,
      });
      setEditing(false);
      onSave?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Partido bloqueado
  if (locked) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-3">
          <span className="text-muted-foreground text-sm">Tu marcador:</span>
          <span className="text-lg font-bold tabular-nums bg-secondary px-4 py-1.5 rounded-xl">
            {prediction?.goalsA ?? '-'} – {prediction?.goalsB ?? '-'}
          </span>
          <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        {knockout && prediction?.advancing_team && (
          <div className="text-xs text-muted-foreground">
            Avanza:{' '}
            <span className="font-medium text-foreground">
              {prediction.advancing_team === 'A' ? match.teamA?.name : match.teamB?.name}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Vista: predicción guardada
  if (!editing && prediction) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Tu marcador:</span>
            <span className="text-xl font-bold tabular-nums bg-primary/10 text-primary px-4 py-1.5 rounded-xl">
              {prediction.goalsA ?? '-'} – {prediction.goalsB ?? '-'}
            </span>
            {knockout && prediction.advancing_team && (
              <span className="text-xs text-muted-foreground">
                Avanza: <span className="font-medium text-foreground">
                  {prediction.advancing_team === 'A' ? match.teamA?.name : match.teamB?.name}
                </span>
              </span>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-secondary hover:bg-muted border border-border rounded-xl text-sm font-medium transition active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
        </div>
      </div>
    );
  }

  // Modo edición
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-muted-foreground truncate w-full text-center">
            {match.teamA?.name ?? 'Local'}
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={goalsA}
            onChange={(e) => { setGoalsA(e.target.value); setAdvancingTeam(null); }}
            disabled={saving}
            className="w-full h-12 text-xl font-bold text-center bg-secondary border-2 border-border rounded-xl focus:outline-none focus:border-primary transition"
            placeholder="0"
          />
        </div>

        <span className="text-muted-foreground font-bold text-lg mt-5">–</span>

        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-muted-foreground truncate w-full text-center">
            {match.teamB?.name ?? 'Visitante'}
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={goalsB}
            onChange={(e) => { setGoalsB(e.target.value); setAdvancingTeam(null); }}
            disabled={saving}
            className="w-full h-12 text-xl font-bold text-center bg-secondary border-2 border-border rounded-xl focus:outline-none focus:border-primary transition"
            placeholder="0"
          />
        </div>

        <div className="flex flex-col gap-1 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-12 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 active:scale-95 transition disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {saving ? '...' : 'Guardar'}
          </button>
          {prediction && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-7 px-4 bg-secondary hover:bg-muted border border-border rounded-xl text-xs transition active:scale-95"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Selector de equipo que avanza — solo en knockout y solo si empate */}
      {knockout && isDraw && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
          <p className="text-xs font-medium text-yellow-600 mb-2">
            Empate en 120 min — ¿Quién avanza por penales?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setAdvancingTeam('A')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition border ${
                advancingTeam === 'A'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary border-border hover:bg-muted'
              }`}
            >
              {match.teamA?.name ?? 'Local'}
            </button>
            <button
              onClick={() => setAdvancingTeam('B')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition border ${
                advancingTeam === 'B'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary border-border hover:bg-muted'
              }`}
            >
              {match.teamB?.name ?? 'Visitante'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
