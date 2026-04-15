'use client';

import { useQuery } from '@tanstack/react-query';
import { getRankings } from '@/lib/rankings';
import { Standing } from '@/types';
import { RulesModal } from '@/components/rules-modal';

export default function RankingsPage() {
  const { data: rankings, isLoading } = useQuery<Standing[]>({
    queryKey: ['rankings'],
    queryFn: getRankings,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ranking</h1>
        <RulesModal />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="space-y-px">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="w-6 h-6 skeleton rounded-full" />
                <div className="flex-1 h-4 skeleton rounded" />
                <div className="w-12 h-4 skeleton rounded" />
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Usuario</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Puntos</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Pronósticos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rankings?.map((standing, index) => (
                <tr key={standing.user_id} className="hover:bg-secondary/50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {standing.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{standing.username}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary">{standing.points}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{standing.predictions_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && (!rankings || rankings.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            No hay predicciones todavía. ¡Sé el primero en participar!
          </div>
        )}
      </div>
    </div>
  );
}
