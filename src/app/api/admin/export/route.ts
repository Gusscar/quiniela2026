import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';
import { calculatePoints } from '@/lib/scoring';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  // Auth + admin check
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: adminRow } = await supabaseAdmin
    .from('admin_users').select('id').eq('id', user.id).maybeSingle();
  if (!adminRow) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  // Fetch all data
  const [matchesRes, teamsRes, profilesRes, predsRes] = await Promise.all([
    supabaseAdmin.from('matches').select('*').order('group_letter').order('datetime'),
    supabaseAdmin.from('teams').select('*'),
    supabaseAdmin.from('user_profiles').select('*').order('username'),
    supabaseAdmin.from('predictions').select('*'),
  ]);

  const matches = matchesRes.data ?? [];
  const teams = teamsRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const preds = predsRes.data ?? [];

  const teamsById = new Map(teams.map((t: any) => [t.id, t]));

  // Normalize predictions
  const predsMap = new Map<string, any>(); // key: `${userId}:${matchId}`
  for (const p of preds) {
    const goalsA = p.goalsA ?? p.goalsa ?? null;
    const goalsB = p.goalsB ?? p.goalsb ?? null;
    predsMap.set(`${p.user_id}:${p.match_id}`, { goalsA, goalsB });
  }

  // ── Sheet 1: RESUMEN ──────────────────────────────────────────
  const summaryRows: any[] = [];
  for (const profile of profiles) {
    let pts = 0, total = 0, exact = 0, winner = 0, draw = 0, missed = 0;
    for (const match of matches) {
      const pred = predsMap.get(`${profile.id}:${match.id}`);
      if (!pred) continue;
      total++;
      if (match.status === 'finished') {
        const p = calculatePoints(
          pred.goalsA, pred.goalsB,
          match.scorea ?? match.scoreA ?? undefined,
          match.scoreb ?? match.scoreB ?? undefined
        );
        pts += p;
        if (p === 3) exact++;
        else if (p === 2) winner++;
        else if (p === 1) draw++;
        else missed++;
      }
    }
    summaryRows.push({
      'Usuario': profile.username ?? 'Sin nombre',
      'Puntos': pts,
      'Predicciones': total,
      'Exactos (3pts)': exact,
      'Ganador (2pts)': winner,
      'Empate (1pt)': draw,
      'Fallados (0pts)': missed,
      'Pendientes': total - exact - winner - draw - missed,
    });
  }
  summaryRows.sort((a, b) => b['Puntos'] - a['Puntos']);
  // Add position
  summaryRows.forEach((r, i) => { r['Pos'] = i + 1; });
  const summarySheet = XLSX.utils.json_to_sheet(
    summaryRows,
    { header: ['Pos', 'Usuario', 'Puntos', 'Predicciones', 'Exactos (3pts)', 'Ganador (2pts)', 'Empate (1pt)', 'Fallados (0pts)', 'Pendientes'] }
  );

  // ── Sheet 2: PREDICCIONES (grilla usuario × partido) ──────────
  // Headers: Usuario | Pts | Grp A: Mx vs Ar | ...
  const matchHeaders = matches.map((m: any) => {
    const tA = teamsById.get(m.teama_id);
    const tB = teamsById.get(m.teamb_id);
    return `${m.group_letter}: ${tA?.name ?? '?'} vs ${tB?.name ?? '?'}`;
  });

  const gridData: any[] = [];
  for (const profile of profiles) {
    const row: Record<string, any> = { 'Usuario': profile.username ?? 'Sin nombre', 'Total Pts': 0 };
    let totalPts = 0;

    for (const m of matches) {
      const pred = predsMap.get(`${profile.id}:${m.id}`);
      const tA = teamsById.get(m.teama_id);
      const tB = teamsById.get(m.teamb_id);
      const header = `${m.group_letter}: ${tA?.name ?? '?'} vs ${tB?.name ?? '?'}`;

      if (!pred) {
        row[header] = '';
      } else {
        const predStr = `${pred.goalsA}-${pred.goalsB}`;
        if (m.status === 'finished') {
          const pts = calculatePoints(
            pred.goalsA, pred.goalsB,
            m.scorea ?? m.scoreA ?? undefined,
            m.scoreb ?? m.scoreB ?? undefined
          );
          totalPts += pts;
          row[header] = `${predStr} (${pts}pts)`;
        } else {
          row[header] = predStr;
        }
      }
    }
    row['Total Pts'] = totalPts;
    gridData.push(row);
  }
  gridData.sort((a, b) => b['Total Pts'] - a['Total Pts']);

  const gridSheet = XLSX.utils.json_to_sheet(gridData, {
    header: ['Usuario', 'Total Pts', ...matchHeaders],
  });

  // Column widths
  summarySheet['!cols'] = [{ wch: 4 }, { wch: 20 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 15 }, { wch: 12 }];
  gridSheet['!cols'] = [{ wch: 20 }, { wch: 9 }, ...matchHeaders.map(() => ({ wch: 24 }))];

  // Build workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen');
  XLSX.utils.book_append_sheet(wb, gridSheet, 'Predicciones');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="quiniela-${date}.xlsx"`,
    },
  });
}
