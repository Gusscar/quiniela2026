'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTeams } from '@/lib/teams';
import { getMatches } from '@/lib/matches';
import { getLocalAnswer } from '@/lib/assistant-brain';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

const PAGE_SUGGESTIONS: Record<string, string[]> = {
  '/predictions': [
    '¿Cómo guardo mi predicción?',
    '¿Puedo editar después de guardar?',
    '¿Cuántos puntos vale el marcador exacto?',
    '¿Cuántos partidos puedo predecir?',
  ],
  '/teams': [
    '¿Cuántos equipos hay?',
    '¿Qué equipos hay en el Grupo A?',
    '¿Cuáles son todos los grupos?',
    '¿Cuándo inicia el Mundial?',
  ],
  '/rankings': [
    '¿Cómo se calculan los puntos?',
    '¿Cuándo se actualiza el ranking?',
    '¿Qué significa el sistema de puntos?',
  ],
  '/rules': [
    '¿Cuánto vale el marcador exacto?',
    '¿Cómo lleno mis predicciones?',
    '¿Cuándo empieza el Mundial?',
  ],
  default: [
    '¿Cómo lleno mis predicciones?',
    '¿Cuántos puntos vale el marcador exacto?',
    '¿Qué equipos hay en el Grupo A?',
    '¿Cuándo inicia el Mundial?',
  ],
};

const WELCOME: Message = {
  role: 'assistant',
  content: '¡Hola! 👋 Soy el árbitro de la Quiniela Mundial 2026 ⚽\n\n¿En qué te puedo ayudar?',
  suggestions: [
    '¿Cómo lleno mis predicciones?',
    '¿Cuántos puntos vale el marcador exacto?',
    '¿Cuántos equipos hay?',
  ],
};

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: getTeams, staleTime: 60000 });
  const { data: matches = [] } = useQuery({ queryKey: ['matches'], queryFn: getMatches, staleTime: 60000 });

  const suggestions = PAGE_SUGGESTIONS[pathname] ?? PAGE_SUGGESTIONS.default;

  // Periodic bounce to attract attention
  useEffect(() => {
    if (open) return;
    const id = setInterval(() => {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 700);
    }, 9000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    // Small delay for "thinking" feel
    setTimeout(() => {
      const answer = getLocalAnswer(text, { teams, matches, pathname });
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: answer.text,
        suggestions: answer.suggestions,
      }]);
      setThinking(false);
    }, 400);
  };

  const lastSuggestions = messages.length <= 1
    ? suggestions
    : messages[messages.length - 1]?.suggestions;

  return (
    <>
      {/* Floating ball */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Asistente árbitro"
        className={`fixed bottom-20 md:bottom-6 right-6 z-50 w-16 h-16 rounded-full text-3xl shadow-2xl
          transition-all duration-200 active:scale-90 select-none
          ${bouncing ? 'ball-bounce' : ''}
          ${open ? 'rotate-12 scale-110' : 'hover:scale-110'}
        `}
        style={{
          background: 'radial-gradient(circle at 32% 32%, #2a2a2a 0%, #000 65%)',
          boxShadow: open
            ? '0 0 0 3px #16c55e, 0 8px 32px rgba(22,197,94,0.4)'
            : '0 6px 28px rgba(0,0,0,0.7)',
        }}
      >
        ⚽
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-36 md:bottom-24 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border border-border shadow-2xl overflow-hidden slide-up"
          style={{ background: '#0d1b2e', maxHeight: '500px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
            style={{ background: '#0a1628' }}>
            <span className="text-xl">🏟️</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-primary leading-none">Árbitro Asistente</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sin internet · Respuesta instantánea</p>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition p-1 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <span className="text-base shrink-0 mt-0.5">⚽</span>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-secondary text-foreground rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex gap-2 justify-start">
                <span className="text-base shrink-0 mt-0.5">⚽</span>
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {lastSuggestions && lastSuggestions.length > 0 && !thinking && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {lastSuggestions.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 hover:bg-primary/20 transition active:scale-95 text-left">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-border flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Pregunta algo..."
              disabled={thinking}
              className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
            <button onClick={() => send(input)} disabled={thinking || !input.trim()}
              className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition disabled:opacity-40 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
