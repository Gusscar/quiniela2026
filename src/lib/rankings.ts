import { Standing } from '@/types';

export async function getRankings(): Promise<Standing[]> {
  const res = await fetch('/api/rankings', { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener el ranking');
  return res.json();
}
