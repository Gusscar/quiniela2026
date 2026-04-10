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
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium">Resultado Exacto</h3>
                <p className="text-muted-foreground text-sm">
                  Si aciertas el marcador exacto (goles de ambos equipos), ganas <strong>3 puntos</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-accent text-accent-foreground w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium">Ganador Correcto</h3>
                <p className="text-muted-foreground text-sm">
                  Si aciertas quién gana (o si hay empate) pero no el marcador exacto, ganas <strong>1 punto</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-muted text-muted-foreground w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                0
              </div>
              <div>
                <h3 className="font-medium">Incorrecto</h3>
                <p className="text-muted-foreground text-sm">
                  Si no aciertas el ganador ni el empate, obtienes <strong>0 puntos</strong>.
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
