import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative">

      {/* Background gradient radial */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0d3320_0%,_#080f1a_60%)] pointer-events-none" />

      {/* Decorative blobs */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-2xl w-full slide-up">

        {/* Trophy + ball */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-5xl trophy-shine select-none">🏆</span>
          <span className="text-6xl float select-none">⚽</span>
          <span className="text-5xl trophy-shine select-none" style={{ animationDelay: '1s' }}>🏆</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-black mb-2 leading-tight tracking-tight">
          <span className="gradient-text">Quiniela</span>
          <br />
          <span className="text-white">Mundial 2026</span>
        </h1>

        {/* Stars */}
        <div className="flex justify-center gap-1 mb-4">
          {['⭐','⭐','⭐','⭐','⭐'].map((s, i) => (
            <span
              key={i}
              className="text-accent text-sm"
              style={{ animation: `twinkle 1.5s ease-in-out ${i * 0.25}s infinite` }}
            >
              {s}
            </span>
          ))}
        </div>

        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Predice los resultados, compite con tus amigos y sube al ranking del Mundial.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link
            href="/register"
            className="relative px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-2xl hover:opacity-90 active:scale-95 transition glow-green"
          >
            ⚽ Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-card border border-border text-foreground font-bold text-lg rounded-2xl hover:border-primary/50 hover:bg-secondary transition"
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Points system */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card/80 border border-border rounded-2xl p-4 backdrop-blur">
            <div className="text-3xl font-black text-primary">3 pts</div>
            <div className="text-xs text-muted-foreground mt-1">Marcador<br/>exacto</div>
          </div>
          <div className="bg-card/80 border border-border rounded-2xl p-4 backdrop-blur">
            <div className="text-3xl font-black text-accent">2 pts</div>
            <div className="text-xs text-muted-foreground mt-1">Ganador<br/>correcto</div>
          </div>
          <div className="bg-card/80 border border-border rounded-2xl p-4 backdrop-blur">
            <div className="text-3xl font-black text-muted-foreground">0 pts</div>
            <div className="text-xs text-muted-foreground mt-1">Resultado<br/>incorrecto</div>
          </div>
        </div>

        {/* Teams count */}
        <p className="mt-6 text-xs text-muted-foreground">
          48 equipos · 12 grupos · 72 partidos de fase grupal
        </p>
      </div>
    </div>
  );
}
