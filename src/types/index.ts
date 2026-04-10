export type Group = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export type MatchStatus = 'pending' | 'live' | 'finished' | 'scheduled';

export interface Team {
  id: string;
  name: string;
  group_letter: Group;
  flag_url: string | null;
  description?: string | null;
}

export interface Match {
  id: string;
  teama_id: string;
  teamb_id: string;
  datetime: string;
  group_letter: Group;
  status: MatchStatus;
  scorea?: number | null;
  scoreb?: number | null;
  teamA?: Team;
  teamB?: Team;
}

export interface Prediction {
  id?: string;
  user_id: string;
  match_id: string;
  goalsA: number | null;
  goalsB: number | null;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
}

export interface Standing {
  user_id: string;
  username: string;
  points: number;
  predictions_count: number;
  position: number;
}
