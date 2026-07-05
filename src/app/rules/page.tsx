export default function RulesPage() {
  const rules = [
    {
      category: 'Resultado Exacto',
      rule: 'Acertar el marcador idéntico a los 90 minutos (ej. dijiste 2-1 y quedó 2-1).',
      points: '3 Puntos',
    },
    {
      category: 'Tendencia',
      rule: 'Acertar al ganador o empate a los 90 min, pero con marcador diferente.',
      points: '2 Puntos',
    },
    {
      category: 'Equipo que Avanza',
      rule: 'Si el partido termina en empate a los 90 min, ganas +1 punto adicional si acertaste el equipo que avanza por penales — aunque tu predicción de marcador no haya sido empate.',
      points: '+1 Punto',
    },
    {
      category: 'Tiempo Oficial',
      rule: "Solo cuentan los 90 minutos reglamentarios más el tiempo añadido. El tiempo extra y los penales NO se incluyen en el marcador — solo se usan para determinar quién avanza.",
      points: '—',
    },
    {
      category: 'Cierre por Partido',
      rule: 'Cada partido se bloquea 5 minutos antes de su inicio. No se aceptan cambios después de ese momento.',
      points: '—',
    },
    {
      category: 'Premiación',
      rule: 'Un único ganador se lleva el 90% del pozo total. El 10% restante corresponde al sistema.',
      points: '—',
    },
    {
      category: 'Empate en Puntos',
      rule: 'Si dos o más jugadores terminan con el mismo puntaje, el premio se divide en partes iguales entre ellos.',
      points: '—',
    },
    {
      category: 'Condición de Pago',
      rule: 'Quiniela sin cancelar, no juega.',
      points: '—',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reglamento de la Quiniela</h1>

      <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 text-left">
              <th className="px-4 py-3 font-semibold w-1/4">Categoría</th>
              <th className="px-4 py-3 font-semibold">Regla</th>
              <th className="px-4 py-3 font-semibold text-right w-24">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((item, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-4 font-medium align-top">{item.category}</td>
                <td className="px-4 py-4 text-muted-foreground leading-relaxed align-top">{item.rule}</td>
                <td className="px-4 py-4 font-semibold text-right align-top whitespace-nowrap">{item.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        El sistema retiene el <strong>10%</strong> del pozo total para gastos operativos. El <strong>90%</strong> restante es para el <strong>único ganador</strong>. En caso de empate en puntos, el premio se divide en partes iguales.
      </p>
    </div>
  );
}
