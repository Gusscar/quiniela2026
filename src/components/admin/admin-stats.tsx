'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  totalPredictions: number;
  totalMatches: number;
  finishedMatches: number;
}

function Icon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactElement> = {
    users: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    target: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
    ),
    calendar: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    trophy: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  };
  return icons[name] || null;
}

export function AdminStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<Stats> => {
      const [users, predictions, matches] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('predictions').select('id', { count: 'exact', head: true }),
        supabase.from('matches').select('id', { count: 'exact', head: true }),
      ]);

      const finishedMatches = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'finished');

      return {
        totalUsers: users.count || 0,
        totalPredictions: predictions.count || 0,
        totalMatches: matches.count || 0,
        finishedMatches: finishedMatches.count || 0,
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border">
            <div className="h-4 w-20 skeleton rounded mb-2" />
            <div className="h-8 w-16 skeleton rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-2">
          <Icon name="users" className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Usuarios</span>
        </div>
        <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-2">
          <Icon name="target" className="w-5 h-5 text-accent" />
          <span className="text-sm text-muted-foreground">Predicciones</span>
        </div>
        <p className="text-3xl font-bold">{stats?.totalPredictions || 0}</p>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-2">
          <Icon name="calendar" className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-muted-foreground">Partidos</span>
        </div>
        <p className="text-3xl font-bold">{stats?.finishedMatches || 0}/{stats?.totalMatches || 0}</p>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-2">
          <Icon name="trophy" className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-muted-foreground">Actividad</span>
        </div>
        <p className="text-3xl font-bold">
          {stats && stats.totalUsers > 0 
            ? Math.round((stats.totalPredictions / stats.totalUsers) * 10) / 10 
            : 0}
          <span className="text-sm font-normal text-muted-foreground"> / usuario</span>
        </p>
      </div>
    </div>
  );
}
