export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reglas del Juego</h1>

      <div className="space-y-8">
        <section className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span> ¿Cómo funciona?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Participa en la quiniela del Mundial de fútbol prediciendo los resultados de los partidos.
            Cada partido tiene dos equipos y debes predecir cuántos goles marcará cada uno.
          </p>
        </section>

        <section className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🏆</span> Sistema de Puntos
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-green-600 text-white w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium">Marcador Exacto</h3>
                <p className="text-muted-foreground text-sm">
                  Aciertas los goles exactos de ambos equipos (ya sea con ganador o empate). Ganas <strong>3 puntos</strong>.
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ej: predices 2-1 y termina 2-1 ✅</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium">Ganador Correcto</h3>
                <p className="text-muted-foreground text-sm">
                  Aciertas qué equipo gana pero el marcador exacto no. Ganas <strong>2 puntos</strong>.
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ej: predices 2-1 y termina 3-1 ✅</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-yellow-500 text-white w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium">Empate Sin Marcador</h3>
                <p className="text-muted-foreground text-sm">
                  Predices empate, el partido termina en empate, pero con marcador diferente. Ganas <strong>1 punto</strong>.
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ej: predices 1-1 y termina 0-0 ✅</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-muted text-muted-foreground w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                0
              </div>
              <div>
                <h3 className="font-medium">Incorrecto</h3>
                <p className="text-muted-foreground text-sm">
                  No aciertas el resultado. Obtienes <strong>0 puntos</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">⏰</span> Plazos
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Puedes modificar tus predicciones en cualquier momento <strong>antes</strong> de que comience el partido.
            Una vez que el partido inicie, tus predicciones se bloquearán y no podrás modificarlas.
          </p>
        </section>

        <section className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">❓</span> Preguntas Frecuentes
          </h2>
          <div className="space-y-4">
            <details className="group">
              <summary className="cursor-pointer font-medium hover:text-primary">
                ¿Puedo participar sin registrarme?
              </summary>
              <p className="text-muted-foreground text-sm mt-2">
                No, necesitas crear una cuenta para poder hacer predicciones y aparecer en el ranking.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-medium hover:text-primary">
                ¿Puedo cambiar mis predicciones después de guardar?
              </summary>
              <p className="text-muted-foreground text-sm mt-2">
                Sí, puedes modificar tus predicciones las veces que quieras mientras el partido no haya comenzado.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-medium hover:text-primary">
                ¿Cómo se desempata el ranking?
              </summary>
              <p className="text-muted-foreground text-sm mt-2">
                Cuando hay empate en puntos, el usuario con más pronósticos realizados aparece primero.
              </p>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
}
