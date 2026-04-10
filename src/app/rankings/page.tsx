import { getRankings } from '@/lib/rankings';
import { Standing } from '@/types';

export const revalidate = 30;

export default async function RankingsPage() {
  let rankings: Standing[] = [];
  try {
    rankings = await getRankings();
  } catch (error) {
    console.error('Error loading rankings:', error);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ranking</h1>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
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

        {(!rankings || rankings.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            No hay predicciones todavía. ¡Sé el primero en participar!
          </div>
        )}
      </div>
    </div>
  );
}
